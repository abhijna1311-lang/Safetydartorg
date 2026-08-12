import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import { FLEET, BUS_STATUS_OPTIONS, VehicleRecordCard } from './BusCollisionSection';
import { NRV_FLEET, NRVRecordCard } from './NRVCollisionSection';
import { TRAIN_FLEET, STREETCAR_FLEET, TrainRecordCard } from './LRVCollisionSection';
import { HI_RAIL_FLEET } from './DerailmentSection';
import { BUS_STOP_OPTIONS } from '../../../data/busStops';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  compactMode?: boolean;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  /** Schedule block injected above the sections (matches Bus/Rail/NRV flows). */
  headerSection?: React.ReactNode;
}

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Spring for follow-up rows that glide in beside a toggle (matches Bus/Rail flows).
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

const inputCls = 'dart-input-base';

// Same visual shell used by Bus/NRV/LRV/Derailment so every mode Step 2 renders under one card.
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

// Stacked yes/no (or short-select) question — label left, control right.
function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function BasicIncidentSection({ data, onUpdate, compactMode = false, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isBus = data.mode === 'Bus';
  const isNRV = data.mode === 'Non-Revenue Vehicle';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isHiRail = data.mode === 'Hi-Rail';
  const isRailLike = isLRV || isStreetcar;

  // Bus → Block → Route cascade (identical to BusCollisionSection so the experience feels the same).
  const busOptions: ComboboxOption[] = FLEET.map(f => ({
    value: f.id, label: f.id, description: f.type,
  }));
  const selectedBus = FLEET.find(f => f.id === data.vehicle_number);
  const busBlocks = (selectedBus?.trips ?? []).flatMap(t => t.blocks.map(b => ({ ...b, trip: t })));
  const blockOptions = busBlocks
    .map(b => ({ value: b.block, label: b.block }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));

  const handleBusChange = (val: string) => {
    const f = FLEET.find(x => x.id === val);
    onUpdate({
      vehicle_number: val,
      fleet_type: f?.type,
      trip_id: undefined, route_number: undefined, end_of_line_destination: undefined,
      block_number: undefined, employee_pullout_date: undefined, employee_pullout_time: undefined,
    });
  };
  const handleBlockChange = (val: string) => {
    const match = busBlocks.find(b => b.block === val);
    onUpdate({
      block_number: val,
      trip_id: match?.trip.trip,
      route_number: match?.trip.route,
      end_of_line_destination: match?.trip.endOfLine,
      employee_pullout_date: match?.pulloutDate,
      employee_pullout_time: match?.pulloutTime,
    });
  };
  const hasBusRecord = !!(data.vehicle_number && data.trip_id?.trim() && data.block_number?.trim());

  // NRV — mirrors NRVCollisionSection's "The NRV" section.
  const nrvOptions: ComboboxOption[] = [...NRV_FLEET]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(v => ({ value: v.id, label: v.id, description: v.type }));
  const selectedNRV = NRV_FLEET.find(v => v.id === data.vehicle_number);
  const handleNRVChange = (val: string) => {
    const v = NRV_FLEET.find(x => x.id === val);
    onUpdate({
      vehicle_number: val,
      fleet_type: v?.type,
      employee_pullout_date: v?.pulloutDate,
      employee_pullout_time: v?.pulloutTime,
    });
  };

  // Rail / Streetcar — mirrors LRVCollisionSection's "The train" / "The streetcar" section.
  const trainFleet = isStreetcar ? STREETCAR_FLEET : TRAIN_FLEET;
  const trainOptions: ComboboxOption[] = [...trainFleet]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(t => ({ value: t.id, label: t.id, description: t.fleetType }));
  const selectedTrain = trainFleet.find(t => t.id === data.train_number);
  const streetcarCars = selectedTrain?.cars ?? [];
  const carOptions = [...streetcarCars]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(c => ({ value: c, label: c }));
  // Streetcar still gates on car number; LRV shows the record once a train is picked (consist entered manually).
  const hasTrainRecord = !!(selectedTrain && (isStreetcar ? data.car_number : true));
  const consistCount = data.lrv_consist_count ?? 0;

  const handleTrainChange = (val: string) => {
    const t = trainFleet.find(x => x.id === val);
    const cars = t?.cars ?? [];
    onUpdate({
      train_number: val,
      lrv_fleet_type: t?.fleetType,
      rail_line: t?.railLine,
      lrv_end_of_line: t?.endOfLine,
      train_pullout_date: t?.pulloutDate,
      train_pullout_time: t?.pulloutTime,
      lrv_consist_count: isStreetcar ? undefined : data.lrv_consist_count,
      lrv_consist_1: isStreetcar ? undefined : data.lrv_consist_1,
      lrv_consist_2: isStreetcar ? undefined : data.lrv_consist_2,
      lrv_consist_3: isStreetcar ? undefined : data.lrv_consist_3,
      lrv_consist_4: isStreetcar ? undefined : data.lrv_consist_4,
      car_number: isStreetcar ? cars[0] : undefined,
    });
  };

  // Hi-Rail — mirrors DerailmentSection's "The Hi-Rail vehicle" section.
  const hiRailOptions: ComboboxOption[] = HI_RAIL_FLEET.map(v => ({
    value: v.id, label: v.id, description: v.fleetType,
  }));
  const selectedHiRail = HI_RAIL_FLEET.find(v => v.id === data.train_number);
  const handleHiRailChange = (val: string) => {
    const v = HI_RAIL_FLEET.find(x => x.id === val);
    onUpdate({
      train_number: val,
      lrv_fleet_type: v?.fleetType,
      train_pullout_date: v?.pulloutDate,
      train_pullout_time: v?.pulloutTime,
      car_number: undefined,
    });
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* 1 — The vehicle: mode-specific identity section. Each mode mirrors the fields its
          collision/derailment section captures so the vehicle experience feels the same. */}
      {isBus && (
        <Section title="The vehicle" help="Enter the bus number and Block ID — the route and the vehicle's assigned details are pulled in automatically.">
          <AnimatePresence>
            {hasBusRecord && (
              <motion.div {...fade} key="vehicle-record">
                <VehicleRecordCard data={data} />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: hasBusRecord ? 26 : undefined }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-[18px]">
            <div>
              <label className="dart-field-label">
                Bus vehicle number <span className="dart-req">*</span>
              </label>
              <div className={showErrors && !data.vehicle_number ? 'dart-field-error' : ''}>
                <SearchableCombobox
                  options={busOptions}
                  value={data.vehicle_number || ''}
                  onChange={handleBusChange}
                  placeholder="Search vehicle #"
                  searchPlaceholder="Type vehicle number..."
                  emptyMessage="No vehicles found"
                />
              </div>
              {showErrors && !data.vehicle_number && (
                <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">Bus vehicle number is required.</p>
              )}
            </div>

            <Field label="Block ID" required error={showErrors && !data.block_number}>
              <CustomSelect value={data.block_number || ''} onChange={handleBlockChange} options={blockOptions} placeholder={data.vehicle_number ? 'Select block' : 'Select bus first'} disabled={!data.vehicle_number} />
            </Field>
            <Field label="Route" required error={showErrors && !data.route_number}>
              <input
                type="text"
                readOnly
                value={data.route_number || ''}
                placeholder={data.block_number ? '—' : 'Auto-filled from block'}
                className="dart-input-base bg-white/70 cursor-not-allowed text-slate-500"
              />
            </Field>
            <Field label="Status before event" required error={showErrors && !data.bus_status_before}>
              <CustomSelect value={data.bus_status_before || ''} onChange={v => onUpdate({ bus_status_before: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
            </Field>
            <Field label="Status after event" required error={showErrors && !data.bus_status_after}>
              <CustomSelect value={data.bus_status_after || ''} onChange={v => onUpdate({ bus_status_after: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
            </Field>
          </div>
        </Section>
      )}

      {isNRV && (
        <Section title="The NRV" help="Enter the NRV number — its vehicle type and pull-out details are pulled in automatically.">
          <AnimatePresence>
            {selectedNRV && (
              <motion.div {...fade} key="nrv-record">
                <NRVRecordCard data={data} />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: selectedNRV ? 26 : undefined }} className="max-w-xl">
            <Field label="NRV number" required error={showErrors && !data.vehicle_number}>
              <SearchableCombobox
                options={nrvOptions}
                value={data.vehicle_number || ''}
                onChange={handleNRVChange}
                placeholder="Search NRV #"
                searchPlaceholder="Type NRV number..."
                emptyMessage="No NRVs found"
              />
            </Field>
          </div>
        </Section>
      )}

      {isRailLike && (
        <Section title={isStreetcar ? 'The streetcar' : 'The train'} help={`Enter the ${isStreetcar ? 'streetcar' : 'train'} number — its assigned fleet, line and schedule are pulled in automatically.`}>
          <AnimatePresence>
            {hasTrainRecord && (
              <motion.div {...fade} key="train-record">
                <TrainRecordCard data={data} showRailLine showConsist={!isStreetcar} showCarNumber={isStreetcar} />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: hasTrainRecord ? 26 : undefined }} className={`grid grid-cols-1 gap-[18px] sm:grid-cols-2 ${isStreetcar ? 'xl:grid-cols-2' : 'xl:grid-cols-3'}`}>
            <Field label={isStreetcar ? 'Streetcar number' : 'LRV number involved in event'} required error={showErrors && !data.train_number}>
              <SearchableCombobox
                options={trainOptions}
                value={data.train_number || ''}
                onChange={handleTrainChange}
                placeholder={isStreetcar ? 'Search streetcar #' : 'Search LRV #'}
                searchPlaceholder={isStreetcar ? 'Type streetcar number...' : 'Type LRV number...'}
                emptyMessage={isStreetcar ? 'No streetcars found' : 'No LRVs found'}
              />
            </Field>
            {isStreetcar && (
              <Field label="Car number involved in event" required error={showErrors && !data.car_number}>
                <CustomSelect value={data.car_number || ''} onChange={v => onUpdate({ car_number: v })} options={carOptions} placeholder={selectedTrain ? 'Select car' : 'Select streetcar first'} disabled={!selectedTrain} />
              </Field>
            )}
            {!isStreetcar && (
              <Field label="LRVs in consist" required error={showErrors && !data.lrv_consist_count}>
                <CustomSelect
                  value={data.lrv_consist_count ? String(data.lrv_consist_count) : ''}
                  onChange={v => {
                    const next = Number(v);
                    const keys = ['lrv_consist_1','lrv_consist_2','lrv_consist_3','lrv_consist_4'] as const;
                    const clear: Partial<AccidentReportData> = {};
                    keys.slice(next).forEach(k => { clear[k] = undefined; });
                    onUpdate({ lrv_consist_count: next, ...clear });
                  }}
                  options={[1,2,3,4].map(n => ({ value: String(n), label: String(n) }))}
                  placeholder="Select count"
                />
              </Field>
            )}
            <Field label="Rail line">
              <input
                type="text"
                readOnly
                value={data.rail_line || ''}
                placeholder={data.train_number ? '—' : 'Auto-filled from train'}
                className="dart-input-base bg-white/70 cursor-not-allowed text-slate-500"
              />
            </Field>
          </div>

          <AnimatePresence>
            {!isStreetcar && consistCount > 0 && (
              <motion.div {...fade} key="consist-numbers" className="mt-4 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
                {(['lrv_consist_1','lrv_consist_2','lrv_consist_3','lrv_consist_4'] as const).slice(0, consistCount).map((key, i) => (
                  <Field key={key} label={`LRV ${i + 1} number`} required error={showErrors && !data[key]}>
                    <input
                      type="text"
                      value={(data[key] as string) || ''}
                      onChange={e => onUpdate({ [key]: e.target.value })}
                      placeholder={`e.g. 210${i + 1}`}
                      className={inputCls}
                    />
                  </Field>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Section>
      )}

      {isHiRail && (
        <Section title="The NRV vehicle" help="Enter the NRV number — its fleet type and pull-out details are pulled in automatically.">
          {selectedHiRail && (
            <div className="dart-vehicle-strip">
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">local_shipping</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">Fleet type</span><span className="dart-vehicle-value">{data.lrv_fleet_type || '\u2014'}</span></div>
              </div>
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">calendar_month</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">Pull-out date</span><span className="dart-vehicle-value dart-tabular">{data.train_pullout_date || '\u2014'}</span></div>
              </div>
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">schedule</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">Pull-out time</span><span className="dart-vehicle-value dart-tabular">{data.train_pullout_time || '\u2014'}</span></div>
              </div>
            </div>
          )}

          <div style={{ marginTop: selectedHiRail ? 26 : undefined }} className="max-w-xl">
            <Field label="NRV number" required error={showErrors && !data.train_number}>
              <SearchableCombobox
                options={hiRailOptions}
                value={data.train_number || ''}
                onChange={handleHiRailChange}
                placeholder="Search NRV #"
                searchPlaceholder="Type vehicle number..."
                emptyMessage="No vehicles found"
              />
            </Field>
          </div>
        </Section>
      )}

      {/* 2 — What happened */}
      <Section title="What happened" help="Describe the event in your own words — this narrative anchors the rest of the report.">
        <Field
          label="Description of event"
          required
          error={showErrors && !narrativeReadOnly && !data.description_of_event}
          helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}
        >
          <textarea
            rows={4}
            value={data.description_of_event || ''}
            onChange={narrativeReadOnly ? undefined : (e => onUpdate({ description_of_event: e.target.value }))}
            placeholder="Describe what happened in your own words..."
            readOnly={narrativeReadOnly}
            className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`}
          />
        </Field>

        {!compactMode && (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Did this event involve an evacuation for life safety reasons?">
              <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
            </BoolRow>
          </div>
        )}
      </Section>

      {/* 3 — Where it happened: location + the conditions there */}
      <Section title="Where it happened" help="The location and the conditions there — where it was, and what the environment was like.">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Field label="Street on" required error={showErrors && !data.street_on}>
            <input type="text" value={data.street_on || ''} onChange={e => onUpdate({ street_on: e.target.value })} placeholder="e.g. Main St" className={inputCls} />
          </Field>
          <Field label="Cross street">
            <input type="text" value={data.cross_street || ''} onChange={e => onUpdate({ cross_street: e.target.value })} placeholder="e.g. Elm Ave" className={inputCls} />
          </Field>
          <Field label="City" required error={showErrors && !data.city}>
            <input type="text" value={data.city || ''} onChange={e => onUpdate({ city: e.target.value })} placeholder="e.g. Dallas" className={inputCls} />
          </Field>
          <Field label="ZIP code">
            <input type="text" maxLength={5} value={data.zip || ''} onChange={e => onUpdate({ zip: e.target.value })} placeholder="e.g. 75201" className={inputCls} />
          </Field>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Did the event occur at a bus stop?" required>
            <YesNoToggle
              value={data.event_at_bus_stop}
              onChange={v => onUpdate({ event_at_bus_stop: v, bus_stop_name: v ? data.bus_stop_name : undefined })}
            />
          </BoolRow>

          <AnimatePresence initial={false}>
            {data.event_at_bus_stop === true && (
              <motion.div
                key="stop-name"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
              >
                <BoolRow label="Name of the bus stop" required>
                  <div className="w-full sm:w-64">
                    <SearchableCombobox
                      options={BUS_STOP_OPTIONS}
                      value={data.bus_stop_name || ''}
                      onChange={v => onUpdate({ bus_stop_name: v })}
                      placeholder="Select bus stop"
                      searchPlaceholder="Search bus stops…"
                      emptyMessage="No bus stops match…"
                    />
                  </div>
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>

          {isBus && !compactMode && (
            <BoolRow label="Does the street have a designated bike lane?">
              <YesNoToggle value={data.has_bike_lane} onChange={v => onUpdate({ has_bike_lane: v })} />
            </BoolRow>
          )}
        </div>
      </Section>

      {/* 5 — Weather and conditions: the environment at the time of the event */}
      {!compactMode && (
        <Section title="Weather and conditions" help="The environment at the time of the event — visibility, road surface, and traffic conditions.">
          <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
        </Section>
      )}

    </div>
  );
}
