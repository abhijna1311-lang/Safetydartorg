import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { VehicleImpactDiagram } from '../../VehicleImpactDiagram';
import { WeatherSection } from './WeatherSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  headerSection?: React.ReactNode;
}

// ── option lists ──────────────────────────────────────────────────────────────
const toOptions = (values: string[]) => [...values]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(v => ({ value: v, label: v }));

const TRAIN_STATUS = toOptions(['In Service', 'Deadhead', 'Pull in', 'Pull out', 'In Yard', 'Not In Service']);
const SHOWS_RAIL_LINE = ['In Service', 'Pull in', 'Pull out'];

const LRV_LOCATION_CATEGORY = toOptions(['Rail Station', 'Right-of-way', 'Grade Crossing', 'Non-Revenue facility/Yard', 'Tunnel', 'Bridge']);
const STREETCAR_LOCATION_CATEGORY = toOptions(['Rail Station', 'Right-of-way', 'Grade Crossing', 'Bridge', 'Non-Revenue Facility/Yard']);
const LRV_STATIONS = [
  'Akard', 'Baylor', 'Buckner', 'Cityplace/Uptown', 'DFW Airport',
  'Downtown Carrollton', 'Downtown Garland', 'Downtown Plano',
  'Inwood/Love Field', 'Mockingbird', 'Parker Road', 'Pearl/Arts District',
  'Downtown Rowlett', 'St. Paul', 'UNT Dallas', 'Victory', 'West End', 'Westmoreland',
];
const STREETCAR_STATIONS = [
  'Bishop Arts', '6th Street', 'Zang Boulevard', 'Beckley',
  'Oakenwald', 'Greenbriar', 'Houston Street', 'EBJ Union Station',
];
const LRV_STATION_OPTIONS = toOptions(LRV_STATIONS);
const STREETCAR_STATION_OPTIONS = toOptions(STREETCAR_STATIONS);
const TUNNEL_LOCATIONS = toOptions(Array.from({ length: 21 }, (_, i) => `Cross Passage ${i + 1}`));

// Train roster — picking a train number pulls its assigned fleet, line, schedule and consist.
// (Prototype data — in production these come from the rail scheduling system.)
const TRAIN_FLEET = [
  { id: 'T-2045', fleetType: 'KIN – Kinki Sharyo USA 1996', railLine: 'Blue',   endOfLine: 'UNT Dallas',       pulloutDate: '2026-07-24', pulloutTime: '05:10', cars: ['2101', '2102'] },
  { id: 'T-2088', fleetType: 'KIN – Kinki Sharyo USA 2005', railLine: 'Red',    endOfLine: 'Westmoreland',     pulloutDate: '2026-07-24', pulloutTime: '04:55', cars: ['2140'] },
  { id: 'T-3120', fleetType: 'KIN – Kinki Sharyo USA 2010', railLine: 'Green',  endOfLine: 'Buckner',          pulloutDate: '2026-07-24', pulloutTime: '06:02', cars: ['2201', '2202', '2203'] },
  { id: 'T-3345', fleetType: 'KIN – Kinki Sharyo USA 1999', railLine: 'Orange', endOfLine: 'DFW Airport',      pulloutDate: '2026-07-24', pulloutTime: '05:40', cars: ['2118', '2119'] },
  { id: 'T-4210', fleetType: 'KIN – Kinki Sharyo USA 1998', railLine: 'Blue',   endOfLine: 'Downtown Rowlett', pulloutDate: '2026-07-24', pulloutTime: '05:20', cars: ['2107', '2108', '2109', '2110'] },
];

// Streetcars are single vehicles on the Streetcar line — no LRV consist is shown.
const STREETCAR_FLEET = [
  { id: 'SC-301', fleetType: 'Brookville Liberty Modern Streetcar', railLine: 'Streetcar', endOfLine: 'Bishop Arts',      pulloutDate: '2026-07-24', pulloutTime: '05:30', cars: ['301'] },
  { id: 'SC-302', fleetType: 'Brookville Liberty Modern Streetcar', railLine: 'Streetcar', endOfLine: 'EBJ Union Station', pulloutDate: '2026-07-24', pulloutTime: '05:45', cars: ['302'] },
  { id: 'SC-303', fleetType: 'Brookville Liberty Modern Streetcar', railLine: 'Streetcar', endOfLine: 'Bishop Arts',      pulloutDate: '2026-07-24', pulloutTime: '06:00', cars: ['303'] },
];

const EVENT_TYPE_WITH = toOptions([
  'Collision – with Auto', 'Collision – with Pedestrian',
  'Collision – with Fixed Object', 'Collision – with Non-Fixed Object',
  'Collision – with Animal',
]);

const TRAIN_ACTION = toOptions([
  'Berthed/Stopped', 'Departing Station Stop', 'Going Backwards',
  'Going Straight (On the move)', 'Moving through Grade Crossing',
  'Negotiating a Curve', 'On Approach to Station', 'Parked',
  'Proceeding through a Switch', 'Servicing a Station',
]);

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Spring for follow-up questions that glide in beneath a toggle (same feel as the bus flow).
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

const inputCls = 'dart-input-base';

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// A single yes/no question rendered as an inline row — label left, control right.
// Keeps the boolean group tight and balanced instead of leaving wide gaps beside compact toggles.
function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${m}/${d}/${y}` : iso;
}
function fmtTime(val?: string) {
  if (!val) return undefined;
  const [h, mm = '00'] = val.split(':');
  const h24 = parseInt(h, 10);
  if (Number.isNaN(h24)) return val;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm.padStart(2, '0')} ${period}`;
}

// Train record pulled from the train roster — reads the live data fields each render, so
// changing the train number re-populates the matching fleet, line and schedule values.
function TrainRecordCard({ data, showRailLine, showConsist, showCarNumber }: { data: AccidentReportData; showRailLine: boolean; showConsist: boolean; showCarNumber: boolean }) {
  const consistCars = [data.lrv_consist_1, data.lrv_consist_2, data.lrv_consist_3, data.lrv_consist_4].filter(Boolean) as string[];
  const cols = [
    { label: 'Fleet type', value: data.lrv_fleet_type, glyph: 'tram' },
    ...(showCarNumber ? [{ label: 'Car number', value: data.car_number, glyph: 'confirmation_number' }] : []),
    ...(showRailLine ? [{ label: 'Rail line', value: data.rail_line, glyph: 'route' }] : []),
    { label: 'Pull-out date', value: fmtDate(data.train_pullout_date), glyph: 'calendar_month' },
    { label: 'Pull-out time', value: fmtTime(data.train_pullout_time), glyph: 'schedule' },
    { label: 'End of line destination', value: data.lrv_end_of_line, glyph: 'flag' },
  ];
  return (
    <div className="dart-vehicle-strip">
      {cols.map(({ label, value, glyph }) => (
        <div key={label} className="dart-vehicle-item">
          <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">{glyph}</span></span>
          <div className="dart-vehicle-text">
            <span className="dart-vehicle-label">{label}</span>
            <span className="dart-vehicle-value dart-tabular">{value || '\u2014'}</span>
          </div>
        </div>
      ))}
      {showConsist && consistCars.length > 0 && (
        <div className="dart-vehicle-item">
          <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">train</span></span>
          <div className="dart-vehicle-text">
            <span className="dart-vehicle-label">Consist ({consistCars.length})</span>
            <span className="dart-vehicle-value dart-tabular">
              {consistCars.map((car, i) => (
                <span key={car}>
                  <span className={car === data.car_number ? 'font-bold text-[#0078AE]' : undefined} title={car === data.car_number ? 'Involved car' : undefined}>{car}</span>
                  {i < consistCars.length - 1 && <span className="text-slate-300">, </span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Which location sub-fields to show based on category
function locationShowsStation(cat: string) { return ['Rail Station', 'Grade Crossing', 'Bridge'].includes(cat); }
function locationShowsGrade(cat: string) { return ['Grade Crossing', 'Bridge'].includes(cat); }
function locationShowsTunnel(cat: string) { return cat === 'Tunnel'; }

export function LRVCollisionSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isStreetcar = data.mode === 'Streetcar';
  const activeFleet = isStreetcar ? STREETCAR_FLEET : TRAIN_FLEET;
  const locationOptions = isStreetcar ? STREETCAR_LOCATION_CATEGORY : LRV_LOCATION_CATEGORY;
  const stationOptions = isStreetcar ? STREETCAR_STATION_OPTIONS : LRV_STATION_OPTIONS;
  const showRailLine = SHOWS_RAIL_LINE.includes(data.train_status_before || '');

  // Train number drives the read-only record card — picking a train pulls its assigned details.
  const trainOptions: ComboboxOption[] = [...activeFleet]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(t => ({ value: t.id, label: t.id, description: t.fleetType }));
  const selectedTrain = activeFleet.find(t => t.id === data.train_number);
  // The pulled record is shown once the train AND the involved car are both identified.
  const hasTrainRecord = !!(selectedTrain && (isStreetcar || data.car_number));

  // Car number is picked from the selected train's consist cars.
  const consistCars = selectedTrain?.cars ?? [];
  const carOptions = [...consistCars]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(c => ({ value: c, label: c }));

  // Selecting a train pulls its fleet, line and schedule. A Streetcar has one car, so its
  // car number is captured automatically; an LRV train clears the field for an explicit choice.
  const handleTrainChange = (val: string) => {
    const t = activeFleet.find(x => x.id === val);
    const cars = t?.cars ?? [];
    onUpdate({
      train_number: val,
      lrv_fleet_type: t?.fleetType,
      rail_line: t?.railLine,
      lrv_end_of_line: t?.endOfLine,
      train_pullout_date: t?.pulloutDate,
      train_pullout_time: t?.pulloutTime,
      lrv_consist_count: isStreetcar ? undefined : cars.length || undefined,
      lrv_consist_1: isStreetcar ? undefined : cars[0],
      lrv_consist_2: isStreetcar ? undefined : cars[1],
      lrv_consist_3: isStreetcar ? undefined : cars[2],
      lrv_consist_4: isStreetcar ? undefined : cars[3],
      car_number: isStreetcar ? cars[0] : undefined,
    });
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* 1 — The train: enter the train number; its assigned details are pulled in automatically */}
      <Section title={isStreetcar ? 'The streetcar' : 'The train'} help={`Enter the ${isStreetcar ? 'streetcar' : 'train'} number — its assigned fleet, line and schedule are pulled in automatically.`}>
        <AnimatePresence>
          {hasTrainRecord && (
            <motion.div {...fade} key="train-record">
              <TrainRecordCard data={data} showRailLine={showRailLine} showConsist={!isStreetcar} showCarNumber={isStreetcar} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: hasTrainRecord ? 26 : undefined }} className={`grid grid-cols-1 gap-[18px] sm:grid-cols-2 ${isStreetcar ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
          <Field label="Train number" required error={showErrors && !data.train_number}>
            <SearchableCombobox
              options={trainOptions}
              value={data.train_number || ''}
              onChange={handleTrainChange}
              placeholder={isStreetcar ? 'Search streetcar #' : 'Search train #'}
              searchPlaceholder={isStreetcar ? 'Type streetcar number...' : 'Type train number...'}
              emptyMessage={isStreetcar ? 'No streetcars found' : 'No trains found'}
            />
          </Field>
          {!isStreetcar && (
            <Field label="Car number involved in event" required error={showErrors && !data.car_number}>
              <CustomSelect value={data.car_number || ''} onChange={v => onUpdate({ car_number: v })} options={carOptions} placeholder={data.train_number ? 'Select car' : 'Select train first'} disabled={!data.train_number} />
            </Field>
          )}
          <Field label="Train status before event" required>
            <CustomSelect value={data.train_status_before || ''} onChange={v => onUpdate({ train_status_before: v })} options={TRAIN_STATUS} placeholder="Select status" />
          </Field>
          <Field label="Train status after event" required>
            <CustomSelect value={data.train_status_after || ''} onChange={v => onUpdate({ train_status_after: v })} options={TRAIN_STATUS} placeholder="Select status" />
          </Field>
        </div>
      </Section>

      {/* 2 — What happened: the narrative and mechanics of the collision */}
      <Section title="What happened" help="One continuous account of the collision — the description, mechanics, impact, and any damage, runaway or evacuation.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Event type with" required>
            <CustomSelect value={data.lrv_collision_type || ''} onChange={v => onUpdate({ lrv_collision_type: v })} options={EVENT_TYPE_WITH} placeholder="Select collision type" />
          </Field>
          <Field label="Train action at time of event" required>
            <CustomSelect value={data.train_action || ''} onChange={v => onUpdate({ train_action: v })} options={TRAIN_ACTION} placeholder="Select action" />
          </Field>
          <Field label="Train speed at time of event (mph)" required>
            <input type="number" min={0} max={90} value={data.train_speed || ''} onChange={e => onUpdate({ train_speed: e.target.value })} placeholder="Enter speed" className={inputCls} />
          </Field>
        </div>

        <Field label="Description of event" required error={showErrors && !narrativeReadOnly && !data.description_of_event} helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}>
          <textarea
            rows={4}
            value={data.description_of_event || ''}
            onChange={narrativeReadOnly ? undefined : (e => onUpdate({ description_of_event: e.target.value }))}
            placeholder="Describe what happened in your own words..."
            readOnly={narrativeReadOnly}
            className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`}
          />
        </Field>

        {/* Evacuation, runaway, derailment and damage — grouped as an inline question list;
            ordered so the impact diagram flows straight after the closing damage question */}
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Did this event involve an evacuation for life safety reasons?" required>
            <YesNoToggle value={data.lrv_evacuation} onChange={v => onUpdate({ lrv_evacuation: v })} />
          </BoolRow>

          <BoolRow label="Did this event involve a runaway train?" required>
            <YesNoToggle
              value={data.runaway_train}
              onChange={v => onUpdate({ runaway_train: v, operator_in_train_runaway: undefined })}
            />
          </BoolRow>

          <AnimatePresence initial={false}>
            {data.runaway_train === true && (
              <motion.div
                key="runaway-followup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
              >
                <BoolRow label="Was the operator in the vehicle when the train ran away?" required>
                  <YesNoToggle
                    value={data.operator_in_train_runaway === 'Operator in vehicle' ? true : data.operator_in_train_runaway === 'Operator not in vehicle' ? false : undefined}
                    onChange={v => onUpdate({ operator_in_train_runaway: v ? 'Operator in vehicle' : 'Operator not in vehicle' })}
                  />
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>

          <BoolRow label="Did this event involve a collision that resulted in a derailment?" required>
            <YesNoToggle value={data.collision_resulted_in_derailment} onChange={v => onUpdate({ collision_resulted_in_derailment: v })} />
          </BoolRow>

          <BoolRow label="Was there train damage?" required>
            <YesNoToggle value={data.train_damage} onChange={v => onUpdate({ train_damage: v, disabling_damage: v ? data.disabling_damage : undefined })} />
          </BoolRow>

          <AnimatePresence initial={false}>
            {data.train_damage === true && (
              <motion.div
                key="disabling-followup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
              >
                <BoolRow label={`Was there any disabling damage to the ${isStreetcar ? 'streetcar' : 'DART vehicle'}?`} required>
                  <YesNoToggle value={data.disabling_damage} onChange={v => onUpdate({ disabling_damage: v })} />
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Point of impact — mark it on the train when there was damage (mirrors the bus flow) */}
        <AnimatePresence>
          {data.train_damage === true && (
            <motion.div {...fade} key="impact-diagram" className="pt-1">
              <VehicleImpactDiagram
                variant={isStreetcar ? 'streetcar' : 'rail'}
                markers={data.impact_markers || []}
                onChange={markers => onUpdate({ impact_markers: markers })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* 3 — Where it happened: location category and address */}
      <Section title="Where it happened" help="The location of the event — the category tells us which extra details apply.">
        <motion.div
          layout
          transition={layoutSpring}
          className={`grid grid-cols-1 gap-4 ${data.location_category === 'Rail Station' || locationShowsTunnel(data.location_category || '') ? 'md:grid-cols-2' : ''}`}
        >
          <Field label="Location category" required>
            <CustomSelect
              value={data.location_category || ''}
              onChange={v => onUpdate({ location_category: v, station_applicable: undefined, grade_crossing_applicable: undefined, tunnel_location: undefined })}
              options={locationOptions}
              placeholder="Select location type"
            />
          </Field>

          <AnimatePresence mode="popLayout">
            {data.location_category === 'Rail Station' && (
              <motion.div {...fade} key="station-companion">
                <Field label="Station" required>
                  <CustomSelect
                    value={data.station_applicable || ''}
                    onChange={v => onUpdate({ station_applicable: v })}
                    options={stationOptions}
                    placeholder="Select station"
                  />
                </Field>
              </motion.div>
            )}
            {!isStreetcar && data.location_category && locationShowsTunnel(data.location_category) && (
              <motion.div {...fade} key="tunnel-companion">
                <Field label="Tunnel location" required>
                  <CustomSelect value={data.tunnel_location || ''} onChange={v => onUpdate({ tunnel_location: v })} options={TUNNEL_LOCATIONS} placeholder="Select cross passage" />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {data.location_category && locationShowsGrade(data.location_category) && (
            <motion.div {...fade} key="grade-details" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Station" required>
                <CustomSelect
                  value={data.station_applicable || ''}
                  onChange={v => onUpdate({ station_applicable: v })}
                  options={stationOptions}
                  placeholder="Select station"
                />
              </Field>
                <Field label="Grade crossing" required>
                  <input type="text" value={data.grade_crossing_applicable || ''} onChange={e => onUpdate({ grade_crossing_applicable: e.target.value })} placeholder="Grade crossing ID" className={inputCls} />
                </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Field label="Street address" required>
                <input type="text" value={data.address_of_event || ''} onChange={e => onUpdate({ address_of_event: e.target.value })} placeholder="Enter street address" className={inputCls} />
              </Field>
            </div>
            <Field label="City" required>
              <input type="text" value={data.city || ''} onChange={e => onUpdate({ city: e.target.value })} placeholder="Enter city" className={inputCls} />
            </Field>
            <Field label="ZIP code" required>
              <input type="text" inputMode="numeric" maxLength={5} value={data.zip || ''} onChange={e => onUpdate({ zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 75201" className={inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      {/* 4 — Weather and conditions: the environment at the time of the event */}
      <Section title="Weather and conditions" help="The environment at the time of the event — visibility, track surface, and traffic conditions.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
      </Section>

    </div>
  );
}