import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { DatePickerInput } from '../../DatePickerInput';
import { TimePickerInput } from '../../TimePickerInput';
import { YesNoToggle } from '../../form/YesNoToggle';
import { VehicleImpactDiagram } from '../../VehicleImpactDiagram';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  narrativeReadOnly?: boolean;
}

// ── option lists ──────────────────────────────────────────────────────────────
const TRAIN_STATUS = ['In Service', 'Deadhead', 'Pull in', 'Pull out', 'In Yard', 'Not In Service'].map(v => ({ value: v, label: v }));
const SHOWS_RAIL_LINE = ['In Service', 'Pull in', 'Pull out'];

const LOCATION_CATEGORY = ['Rail Station', 'Right-of-way', 'Grade Crossing', 'Non-Revenue facility/Yard', 'Tunnel', 'Bridge'].map(v => ({ value: v, label: v }));
const TUNNEL_LOCATIONS = Array.from({ length: 21 }, (_, i) => ({ value: `Cross Passage ${i + 1}`, label: `Cross Passage ${i + 1}` }));

const LRV_FLEET = [
  'KIN – Kinki Sharyo USA 1996', 'KIN – Kinki Sharyo USA 1998',
  'KIN – Kinki Sharyo USA 1999', 'KIN – Kinki Sharyo USA 2005',
  'KIN – Kinki Sharyo USA 2010',
].map(v => ({ value: v, label: v }));

const RAIL_LINES = ['Blue', 'Red', 'Green', 'Orange'].map(v => ({ value: v, label: v }));

const EVENT_TYPE_WITH = [
  'Collision – with Auto', 'Collision – with Pedestrian',
  'Collision – with Fixed Object', 'Collision – with Non-Fixed Object',
  'Collision – with Animal',
].map(v => ({ value: v, label: v }));

const TRAIN_ACTION = [
  'Berthed/Stopped', 'Departing Station Stop', 'Going Backwards',
  'Going Straight (On the move)', 'Moving through Grade Crossing',
  'Negotiating a Curve', 'On Approach to Station', 'Parked',
  'Proceeding through a Switch', 'Servicing a Station',
].map(v => ({ value: v, label: v }));

const LRV_IMPACT = [
  'Front Impact', 'Left Side Impact', 'Left Sideswipe', 'Rear Impact',
  'Right Side Impact', 'Right Side Sideswipe', 'Roof/Top of Vehicle', 'Underbody',
].map(v => ({ value: v, label: v }));

const RUNAWAY_OPERATOR = ['Operator not in vehicle', 'Operator in vehicle'].map(v => ({ value: v, label: v }));
const CONSIST_OPTIONS = [1, 2, 3, 4].map(n => ({ value: String(n), label: String(n) }));

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const inputCls = "dart-input-base";

function Field({ label, required, helper, children }: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helper && <p className="mt-1 text-xs text-slate-500 font-['Poppins']">{helper}</p>}
    </div>
  );
}

function Card({ title, complete, children }: { title: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

// Which location sub-fields to show based on category
function locationShowsStation(cat: string) { return ['Rail Station', 'Grade Crossing', 'Bridge'].includes(cat); }
function locationShowsGrade(cat: string) { return ['Grade Crossing', 'Bridge'].includes(cat); }
function locationShowsTunnel(cat: string) { return cat === 'Tunnel'; }

export function LRVCollisionSection({ data, onUpdate, narrativeReadOnly = false }: Props) {
  const showRailLine = SHOWS_RAIL_LINE.includes(data.train_status_before || '');
  const consist = data.lrv_consist_count ?? 0;

  return (
    <div className="space-y-5">

      {/* Description + Date/Time */}
      <Card title="Event description & timing" complete={!!(data.description_of_event && data.incident_date && data.incident_time)}>
        <Field label="Description of event" required helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}>
          <textarea
            rows={4}
            value={data.description_of_event || ''}
            onChange={narrativeReadOnly ? undefined : (e => onUpdate({ description_of_event: e.target.value }))}
            placeholder="Describe what happened in your own words..."
            readOnly={narrativeReadOnly}
            className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Event date" required>
            <DatePickerInput value={data.incident_date || ''} onChange={v => onUpdate({ incident_date: v })} />
          </Field>
          <Field label="Event time" required>
            <TimePickerInput value={data.incident_time || ''} onChange={v => onUpdate({ incident_time: v })} />
          </Field>
        </div>
      </Card>

      {/* Train Vehicle */}
      <Card title="Train vehicle details" complete={!!data.train_number}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Train number" required>
            <input type="text" value={data.train_number || ''} onChange={e => onUpdate({ train_number: e.target.value })} placeholder="e.g. T-2045" className={inputCls} />
          </Field>
          <Field label="Car number involved in event">
            <input type="text" value={data.car_number || ''} onChange={e => onUpdate({ car_number: e.target.value })} placeholder="e.g. 2101" className={inputCls} />
          </Field>
          <Field label="Train pull-out date">
            <DatePickerInput value={data.train_pullout_date || ''} onChange={v => onUpdate({ train_pullout_date: v })} />
          </Field>
          <Field label="Train pull-out time">
            <TimePickerInput value={data.train_pullout_time || ''} onChange={v => onUpdate({ train_pullout_time: v })} />
          </Field>
        </div>

        <Field label="How many LRVs in consist?">
          <div className="flex gap-3">
            {CONSIST_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({ lrv_consist_count: Number(opt.value) })}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-['Poppins'] transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${data.lrv_consist_count === Number(opt.value) ? 'border-[#0078AE] bg-[#E8F4FA] text-[#00205B] font-medium' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <AnimatePresence>
          {consist >= 1 && (
            <motion.div {...fade} key="consist-inputs" className="grid grid-cols-2 gap-4">
              {Array.from({ length: consist }, (_, i) => i + 1).map(n => (
                <Field key={n} label={`Consist ${n}`}>
                  <input
                    type="text"
                    value={(data[`lrv_consist_${n}` as keyof AccidentReportData] as string) || ''}
                    onChange={e => onUpdate({ [`lrv_consist_${n}`]: e.target.value } as any)}
                    placeholder={`Car number ${n}`}
                    className={inputCls}
                  />
                </Field>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4">
          <Field label="LRV fleet type">
            <CustomSelect value={data.lrv_fleet_type || ''} onChange={v => onUpdate({ lrv_fleet_type: v })} options={LRV_FLEET} placeholder="Select fleet type" />
          </Field>
        </div>
      </Card>

      {/* Location */}
      <Card title="Location" complete={!!data.location_category}>
        <Field label="Location category" required>
          <CustomSelect
            value={data.location_category || ''}
            onChange={v => onUpdate({ location_category: v, station_applicable: undefined, grade_crossing_applicable: undefined, tunnel_location: undefined })}
            options={LOCATION_CATEGORY}
            placeholder="Select location type"
          />
        </Field>

        <AnimatePresence>
          {data.location_category && locationShowsStation(data.location_category) && (
            <motion.div {...fade} key="station">
              <Field label="Station (if applicable)">
                <input type="text" value={data.station_applicable || ''} onChange={e => onUpdate({ station_applicable: e.target.value })} placeholder="Station name" className={inputCls} />
              </Field>
            </motion.div>
          )}
          {data.location_category && locationShowsGrade(data.location_category) && (
            <motion.div {...fade} key="grade">
              <Field label="Grade crossing (if applicable)">
                <input type="text" value={data.grade_crossing_applicable || ''} onChange={e => onUpdate({ grade_crossing_applicable: e.target.value })} placeholder="Grade crossing ID" className={inputCls} />
              </Field>
            </motion.div>
          )}
          {data.location_category && locationShowsTunnel(data.location_category) && (
            <motion.div {...fade} key="tunnel">
              <Field label="Tunnel location">
                <CustomSelect value={data.tunnel_location || ''} onChange={v => onUpdate({ tunnel_location: v })} options={TUNNEL_LOCATIONS} placeholder="Select cross passage" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Address of event">
          <input type="text" value={data.address_of_event || ''} onChange={e => onUpdate({ address_of_event: e.target.value })} placeholder="Street address" className={inputCls} />
        </Field>
      </Card>

      {/* Train Status + Rail Line */}
      <Card title="Train status & line" complete={!!(data.train_status_before && data.train_status_after)}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Train status before event" required>
            <CustomSelect value={data.train_status_before || ''} onChange={v => onUpdate({ train_status_before: v })} options={TRAIN_STATUS} placeholder="Select status" />
          </Field>
          <Field label="Train status after event" required>
            <CustomSelect value={data.train_status_after || ''} onChange={v => onUpdate({ train_status_after: v })} options={TRAIN_STATUS} placeholder="Select status" />
          </Field>
        </div>

        <AnimatePresence>
          {showRailLine && (
            <motion.div {...fade} key="rail-line" className="grid grid-cols-2 gap-4">
              <Field label="Rail line">
                <CustomSelect value={data.rail_line || ''} onChange={v => onUpdate({ rail_line: v })} options={RAIL_LINES} placeholder="Select line" />
              </Field>
              <Field label="End of line destination">
                <input type="text" value={data.lrv_end_of_line || ''} onChange={e => onUpdate({ lrv_end_of_line: e.target.value })} placeholder="e.g. Parker Road" className={inputCls} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Collision Details */}
      <Card title="Collision details" complete={!!(data.lrv_collision_type && data.train_action && data.lrv_point_of_impact)}>
        <Field label="Event type with" required>
          <CustomSelect value={data.lrv_collision_type || ''} onChange={v => onUpdate({ lrv_collision_type: v })} options={EVENT_TYPE_WITH} placeholder="Select collision type" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Train action at time of event" required>
            <CustomSelect value={data.train_action || ''} onChange={v => onUpdate({ train_action: v })} options={TRAIN_ACTION} placeholder="Select action" />
          </Field>
          <Field label="Point of impact" required>
            <CustomSelect value={data.lrv_point_of_impact || ''} onChange={v => onUpdate({ lrv_point_of_impact: v })} options={LRV_IMPACT} placeholder="Select impact point" />
          </Field>
          <Field label="Train speed at time of event (mph)">
            <input type="number" min={0} max={90} value={data.train_speed || ''} onChange={e => onUpdate({ train_speed: e.target.value })} placeholder="0" className={inputCls} />
          </Field>
        </div>

        {/* Visual impact diagram */}
        <div className="pt-1">
          <VehicleImpactDiagram
            markers={data.impact_markers || []}
            onChange={markers => onUpdate({ impact_markers: markers })}
          />
        </div>

        <Field label="Train damage?">
          <YesNoToggle value={data.train_damage} onChange={v => onUpdate({ train_damage: v, disabling_damage: v ? data.disabling_damage : undefined })} />
        </Field>
        <AnimatePresence>
          {data.train_damage === true && (
            <motion.div {...fade} key="disabling">
              <Field label="Was there any disabling damage to the DART vehicle?">
                <YesNoToggle value={data.disabling_damage} onChange={v => onUpdate({ disabling_damage: v })} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Did this event involve a collision that resulted in a derailment?">
          <YesNoToggle value={data.collision_resulted_in_derailment} onChange={v => onUpdate({ collision_resulted_in_derailment: v })} />
        </Field>
      </Card>

      {/* Runaway & Evacuation */}
      <Card title="Runaway & evacuation" complete={data.runaway_train !== undefined && data.lrv_evacuation !== undefined}>
        <Field label="Did this event involve a runaway train?">
          <YesNoToggle
            value={data.runaway_train}
            onChange={v => onUpdate({ runaway_train: v, operator_in_train_runaway: undefined })}
          />
        </Field>
        <AnimatePresence>
          {data.runaway_train === true && (
            <motion.div {...fade} key="train-runaway">
              <Field label="Was the operator in the vehicle when the train ran away?">
                <CustomSelect value={data.operator_in_train_runaway || ''} onChange={v => onUpdate({ operator_in_train_runaway: v })} options={RUNAWAY_OPERATOR} placeholder="Select" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <Field label="Did this event involve an evacuation for life safety reasons?">
          <YesNoToggle value={data.lrv_evacuation} onChange={v => onUpdate({ lrv_evacuation: v })} />
        </Field>
      </Card>

    </div>
  );
}