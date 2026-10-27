import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Crosshair, Loader2, MapPin, MapPinOff, Search, X } from 'lucide-react';
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import type { AccidentReportData } from '../../types/accident-report';
import {
  DALLAS_CENTER,
  MAPBOX_TOKEN,
  MAP_MAX_BOUNDS,
  MAP_STYLE,
  OUTSIDE_SERVICE_AREA_MASK,
  SERVICE_AREA_RING,
  findNearbyStreets,
  formatCoordinates,
  isInServiceArea,
  isMapboxConfigured,
  normalizeStreetName,
  reverseGeocode,
  searchPlaces,
  type LngLat,
  type NearbyStreet,
  type SearchSuggestion,
} from '../../utils/mapbox';
import {
  OPERATOR_LOCATION,
  readAutofilled,
  readPin,
  readRole,
  roleKey,
  writeRole,
  type AddressRole,
  type LocationFieldConfig,
} from './locationFields';

interface LocationPickerProps {
  data: AccidentReportData;
  onUpdate: (patch: Partial<AccidentReportData>) => void;
  /** Which report fields this block reads and writes. Defaults to the operator's event location. */
  config?: LocationFieldConfig;
  /**
   * The address fields. Rendered inside the picker's side panel ('panel', two columns)
   * or on their own when the map is unavailable ('standalone', full width).
   */
  children?: (layout: 'panel' | 'standalone') => ReactNode;
}

type ResolveState = 'idle' | 'resolving' | 'resolved' | 'error';

const OUTSIDE_AREA_MESSAGE = 'That spot is outside the DART service area. Pin a location inside the highlighted area.';

/**
 * Search, click, or use device location to pin where the event happened.
 * Fills Street / City / ZIP and suggests the cross street. The text fields stay
 * editable; anything the user typed by hand is never overwritten by a later pin.
 */
export function LocationPicker({ data, onUpdate, config = OPERATOR_LOCATION, children }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const markerFactoryRef = useRef<((point: LngLat) => MapboxMarker) | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const configRef = useRef(config);
  configRef.current = config;
  const resolveAbortRef = useRef<AbortController | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const pin: LngLat | null = readPin(data, config);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [resolveState, setResolveState] = useState<ResolveState>(pin ? 'resolved' : 'idle');
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);
  const [crossSuggestions, setCrossSuggestions] = useState<NearbyStreet[]>([]);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [areaNotice, setAreaNotice] = useState<string | null>(null);

  const resolvePin = useCallback(async (point: LngLat) => {
    resolveAbortRef.current?.abort();
    const controller = new AbortController();
    resolveAbortRef.current = controller;
    setResolveState('resolving');
    setCrossSuggestions([]);
    try {
      const address = await reverseGeocode(point, controller.signal);
      const current = dataRef.current;
      const cfg = configRef.current;
      const autofilled = new Set<AddressRole>(readAutofilled(current, cfg));
      const patch: Partial<AccidentReportData> = {};
      const fill = (role: AddressRole, value?: string) => {
        if (!value || !roleKey(cfg, role)) return;
        if (readRole(current, cfg, role) && !autofilled.has(role)) return;
        Object.assign(patch, writeRole(cfg, role, value));
        autofilled.add(role);
      };
      if (cfg.streetAsFullAddress) {
        fill('street', address.fullAddress?.replace(/, United States$/, ''));
      } else {
        fill('street', address.street);
        fill('city', address.city);
        fill('zip', address.zip);
      }
      // The previous cross-street pick belonged to the old pin.
      if (autofilled.has('cross')) {
        Object.assign(patch, writeRole(cfg, 'cross', ''));
        autofilled.delete('cross');
      }
      Object.assign(patch, { [cfg.autofilled]: Array.from(autofilled) });
      onUpdate(patch);
      setResolvedLabel(address.fullAddress ?? null);

      if (cfg.cross) {
        const streetForExclusion = address.street ?? readRole(current, cfg, 'street');
        const nearby = await findNearbyStreets(point, streetForExclusion, controller.signal);
        setCrossSuggestions(nearby);
      }
      setResolveState('resolved');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setResolveState('error');
    }
  }, [onUpdate]);

  const placePin = useCallback((point: LngLat, opts: { fly?: boolean } = {}) => {
    const cfg = configRef.current;
    if (!isInServiceArea(point)) {
      setAreaNotice(OUTSIDE_AREA_MESSAGE);
      // Snap a dragged marker back to the last valid pin.
      const previous = readPin(dataRef.current, cfg);
      if (markerRef.current) {
        if (previous) markerRef.current.setLngLat([previous.lng, previous.lat]);
        else { markerRef.current.remove(); markerRef.current = null; }
      }
      return;
    }
    setAreaNotice(null);
    onUpdate({ [cfg.lat]: Number(point.lat.toFixed(6)), [cfg.lng]: Number(point.lng.toFixed(6)) } as Partial<AccidentReportData>);
    const map = mapRef.current;
    if (map) {
      if (markerRef.current) markerRef.current.setLngLat([point.lng, point.lat]);
      else if (markerFactoryRef.current) markerRef.current = markerFactoryRef.current(point);
      if (opts.fly) map.flyTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), 16), essential: true });
    }
    void resolvePin(point);
  }, [onUpdate, resolvePin]);

  const placePinRef = useRef(placePin);
  placePinRef.current = placePin;

  // mapbox-gl (~1 MB) is loaded only when this component mounts.
  useEffect(() => {
    if (!isMapboxConfigured() || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ default: mapboxgl }] = await Promise.all([
          import('mapbox-gl'),
          import('mapbox-gl/dist/mapbox-gl.css'),
        ]);
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = MAPBOX_TOKEN!;
        containerRef.current.replaceChildren();
        const start = readPin(dataRef.current, configRef.current);
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: start ? [start.lng, start.lat] : DALLAS_CENTER,
          zoom: start ? 15.5 : 10,
          maxBounds: MAP_MAX_BOUNDS,
          minZoom: 9.3,
          cooperativeGestures: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        const navy = getComputedStyle(document.documentElement).getPropertyValue('--dart-brand-navy').trim() || undefined;
        const brand = navy ?? 'rgb(0, 32, 91)';
        markerFactoryRef.current = (point) => {
          const marker = new mapboxgl.Marker({ color: navy, draggable: true }).setLngLat([point.lng, point.lat]).addTo(map);
          marker.on('dragend', () => {
            const { lng, lat } = marker.getLngLat();
            placePinRef.current({ lng, lat });
          });
          return marker;
        };
        if (start) markerRef.current = markerFactoryRef.current(start);
        map.on('click', (e) => placePinRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat }));
        map.on('load', () => {
          if (cancelled) return;
          // Dim everything outside the service area and outline its edge.
          map.addSource('outside-service-area', { type: 'geojson', data: OUTSIDE_SERVICE_AREA_MASK });
          map.addLayer({ id: 'outside-service-area-fill', type: 'fill', source: 'outside-service-area', paint: { 'fill-color': brand, 'fill-opacity': 0.14 } });
          map.addSource('service-area-edge', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: SERVICE_AREA_RING } } });
          map.addLayer({ id: 'service-area-edge-line', type: 'line', source: 'service-area-edge', paint: { 'line-color': brand, 'line-width': 1.5, 'line-opacity': 0.55, 'line-dasharray': [3, 2] } });
          setMapReady(true);
          map.resize();
        });
        map.on('error', (e) => {
          if (cancelled || map.loaded()) return;
          console.warn('[LocationPicker] Map failed to load', e.error);
          setMapError('The map is unavailable right now.');
        });
        mapRef.current = map;
        resizeObserverRef.current = new ResizeObserver(() => map.resize());
        resizeObserverRef.current.observe(containerRef.current);
      } catch {
        if (!cancelled) setMapError('The map is unavailable right now.');
      }
    })();
    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resolveAbortRef.current?.abort();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const clearPin = () => {
    resolveAbortRef.current?.abort();
    markerRef.current?.remove();
    markerRef.current = null;
    setCrossSuggestions([]);
    setResolvedLabel(null);
    setResolveState('idle');
    onUpdate({ [config.lat]: undefined, [config.lng]: undefined, [config.autofilled]: [] } as Partial<AccidentReportData>);
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Location is not available on this device.');
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        placePin({ lng: pos.coords.longitude, lat: pos.coords.latitude }, { fly: true });
      },
      (err) => {
        setLocating(false);
        setGeoError(err.code === err.PERMISSION_DENIED
          ? 'Location permission was denied. Search or click the map instead.'
          : 'Could not get your location. Search or click the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const pickCrossStreet = (name: string) => {
    const autofilled = new Set<AddressRole>(readAutofilled(data, config));
    autofilled.add('cross');
    onUpdate({ ...writeRole(config, 'cross', name), [config.autofilled]: Array.from(autofilled) } as Partial<AccidentReportData>);
  };

  const devNotice = import.meta.env.DEV ? (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-dart-surface-soft px-4 py-3.5">
      <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="dart-h4">Map pinning is not configured</p>
        <p className="dart-caption mt-0.5">
          Add <code className="rounded bg-white px-1 py-0.5 text-[11px] text-dart-text">VITE_MAPBOX_TOKEN</code> to <code className="rounded bg-white px-1 py-0.5 text-[11px] text-dart-text">.env.local</code> and restart the dev server. Only developers see this message. The address fields work as usual.
        </p>
      </div>
    </div>
  ) : null;

  if (!isMapboxConfigured()) {
    return (
      <div className="space-y-4">
        {devNotice}
        {children?.('standalone')}
      </div>
    );
  }

  const crossValue = readRole(data, config, 'cross');
  const currentCross = crossValue ? normalizeStreetName(crossValue) : null;

  return (
    <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_10px_28px_-18px_rgba(15,23,42,0.22)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Find, confirm, and edit */}
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div>
          <PlaceSearch proximity={pin ?? undefined} onSelect={(s) => placePin(s.center, { fly: true })} />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="dart-focus-ring mt-1.5 inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-dart-accent-blue hover:underline disabled:opacity-60 font-['Poppins']"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            {locating ? 'Finding your location' : 'Use my current location'}
          </button>
        </div>

        <div className="space-y-3" aria-live="polite">
          {!pin ? (
            <p className="dart-caption">
              Search above or click the map to drop a pin. Street, city and ZIP fill in automatically, and you can still edit them.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-dart-surface-soft">
              <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-dart-navy">
                    <MapPin className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="min-w-0">
                    {resolveState === 'resolving' ? (
                      <div className="my-1 h-3.5 w-48 max-w-full animate-pulse rounded bg-slate-200" aria-label="Looking up address" />
                    ) : (
                      <p className="text-sm font-medium leading-snug text-dart-text-strong font-['Poppins']">
                        {resolveState === 'error'
                          ? 'Pin placed. Address lookup failed, so enter it below.'
                          : resolvedLabel?.replace(/, United States$/, '') || (['street', 'city', 'zip'] as const).map((role) => readRole(data, config, role)).filter(Boolean).join(', ') || 'Pinned location'}
                      </p>
                    )}
                    <p className="dart-caption dart-tabular">{formatCoordinates(pin)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearPin}
                  aria-label="Remove pin"
                  className="dart-focus-ring -mr-1 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-white hover:text-dart-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {crossSuggestions.length > 0 && (
                <div className="border-t border-slate-200/80 px-3.5 py-3">
                  <p className="dart-eyebrow mb-2">Pick the cross street</p>
                  <div className="flex flex-wrap gap-1.5">
                    {crossSuggestions.map((s, i) => {
                      const selected = currentCross === normalizeStreetName(s.name);
                      return (
                        <button
                          key={s.name}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => pickCrossStreet(s.name)}
                          className={`dart-press dart-focus-ring inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium font-['Poppins'] ${
                            selected
                              ? 'border-dart-navy bg-dart-selected text-dart-navy'
                              : 'border-slate-300 bg-white text-dart-text hover:border-slate-400'
                          }`}
                        >
                          {s.name}
                          {i === 0 && !selected && <span className="text-[10px] font-semibold uppercase tracking-wide text-dart-accent-blue">Nearest</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {areaNotice && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 font-['Poppins']">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
              {areaNotice}
            </p>
          )}
          {geoError && <p className="text-xs font-medium text-red-600 font-['Poppins']">{geoError}</p>}
        </div>

        {children && <div className="mt-auto border-t border-slate-200/80 pt-4">{children('panel')}</div>}
      </div>

      {/* Map */}
      <div className="relative min-h-[320px] border-t border-slate-200/80 bg-dart-surface-muted lg:min-h-[440px] lg:border-l lg:border-t-0">
        <div className="absolute inset-0">
          {/* Explicit h-full/w-full: mapbox-gl's CSS forces .mapboxgl-map to position:relative, which would collapse an inset-0 box to 0px. */}
          <div ref={containerRef} className="h-full w-full" role="application" aria-label="Map of the DART service area. Click to drop a pin where the event happened." />
        </div>
        {!mapReady && !mapError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-dart-surface-muted to-dart-surface-soft" aria-hidden="true" />
        )}
        {mapError && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <p className="dart-caption">{mapError} Search or enter the address instead.</p>
          </div>
        )}
        {mapReady && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-dart-text shadow-[0_2px_8px_rgba(15,23,42,0.12)] font-['Poppins']">
            <span aria-hidden="true" className="h-0 w-4 border-t-2 border-dashed border-dart-navy/60" />
            DART service area
          </div>
        )}
        {mapReady && !pin && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <span className="rounded-full bg-dart-navy px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_4px_12px_rgba(0,32,91,0.3)] font-['Poppins']">
              Click the map to drop a pin
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceSearch({ proximity, onSelect }: { proximity?: LngLat; onSelect: (s: SearchSuggestion) => void }) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const proximityRef = useRef(proximity);
  proximityRef.current = proximity;
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (query.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchPlaces(query, proximityRef.current, controller.signal);
        setResults(r);
        setActive(r.length ? 0 : -1);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const choose = (s: SearchSuggestion) => {
    skipNextSearchRef.current = true;
    setQuery(s.label);
    setOpen(false);
    onSelect(s);
  };

  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label="Search for an address or place"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(results[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search an address, intersection, or landmark"
        className="dart-input-base !pl-9 !pr-9"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
      {open && results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.35)]">
          {results.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(s); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 ${i === active ? 'bg-dart-selected' : ''}`}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-dart-text-strong font-['Poppins']">{s.label}</span>
                {s.secondary && <span className="dart-caption block truncate">{s.secondary}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
