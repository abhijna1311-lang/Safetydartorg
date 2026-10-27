import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { formatCoordinates, staticMapUrl, type LngLat } from '../../utils/mapbox';

interface LocationMapPreviewProps {
  lat?: number;
  lng?: number;
  /** Address line shown under the map. */
  label?: string;
  className?: string;
}

/** Read-only static map of the pinned event location, for review and reference screens. */
export function LocationMapPreview({ lat, lng, label, className = '' }: LocationMapPreviewProps) {
  const [failed, setFailed] = useState(false);
  if (lat == null || lng == null) return null;
  const point: LngLat = { lat, lng };
  const src = staticMapUrl(point, 640, 220);
  const externalHref = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <figure className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      {src && !failed && (
        <img
          src={src}
          alt={`Map showing the pinned event location${label ? ` at ${label}` : ''}`}
          width={640}
          height={220}
          loading="lazy"
          onError={() => setFailed(true)}
          className="block h-[180px] w-full bg-dart-surface-muted object-cover sm:h-[200px]"
        />
      )}
      <figcaption className="flex items-center justify-between gap-3 px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-dart-navy" />
          <span className="min-w-0">
            {label && <span className="block truncate text-sm font-medium text-dart-text-strong font-['Poppins']">{label}</span>}
            <span className="dart-caption dart-tabular block">Pinned at {formatCoordinates(point)}</span>
          </span>
        </span>
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="dart-focus-ring inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-dart-accent-blue hover:underline font-['Poppins']"
        >
          Open map
          <ExternalLink className="h-3 w-3" />
        </a>
      </figcaption>
    </figure>
  );
}
