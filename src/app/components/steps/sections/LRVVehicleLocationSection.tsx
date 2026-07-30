import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { DatePickerInput } from '../../DatePickerInput';
import { TimePickerInput } from '../../TimePickerInput';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
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

const CONSIST_OPTIONS = [1, 2, 3, 4].map(n => ({ value: String(n), label: String(n) }));

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const inputCls = "dart-input-base";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Card({ title, complete, children }: { title: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <div className="dart-card dart-card--surface">
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

export function LRVVehicleLocationSection({ data, onUpdate }: Props) {
  const showRailLine = SHOWS_RAIL_LINE.includes(data.train_status_before || '');
  const consist = data.lrv_consist_count ?? 0;

  return (
    <div className="space-y-5">

      {/* Description + Date/Time */}
      <Card title="Event description & timing" complete={!!(data.description_of_event && data.incident_date && data.incident_time)}>
        <Field label="Description of event" required>
          <textarea
            rows={4}
            value={data.description_of_event || ''}
            onChange={e => onUpdate({ description_of_event: e.target.value })}
            placeholder="Describe what happened in your own words..."
            className={`${inputCls} resize-none`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Event date" required>
            <DatePickerInput value={data.incident_date || ''} onChange={v => onUpdate({ incident_date: v })} maxDate={new Date()} />
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
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-['Poppins'] transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] ${data.lrv_consist_count === Number(opt.value) ? 'border-[#00205B] bg-[#EAF1F8] text-[#00205B] font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
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
                <Field key={n} label={`LRV ${n} fleet type`}>
                  <CustomSelect
                    value={(data[`lrv_${n}_fleet` as keyof AccidentReportData] as string) || ''}
                    onChange={v => onUpdate({ [`lrv_${n}_fleet`]: v })}
                    options={LRV_FLEET}
                    placeholder="Select fleet"
                  />
                </Field>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Location */}
      <Card title="Location" complete={!!data.location_category}>
        <Field label="Location category" required>
          <CustomSelect value={data.location_category || ''} onChange={v => onUpdate({ location_category: v })} options={LOCATION_CATEGORY} placeholder="Select category" />
        </Field>

        <AnimatePresence>
          {locationShowsStation(data.location_category || '') && (
            <motion.div {...fade} key="station-name">
              <Field label="Rail station">
                <input type="text" value={data.rail_station || ''} onChange={e => onUpdate({ rail_station: e.target.value })} placeholder="e.g. West End Station" className={inputCls} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {locationShowsGrade(data.location_category || '') && (
            <motion.div {...fade} key="grade-crossing">
              <Field label="Grade crossing name">
                <input type="text" value={data.grade_crossing_name || ''} onChange={e => onUpdate({ grade_crossing_name: e.target.value })} placeholder="e.g. Elm St Crossing" className={inputCls} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {locationShowsTunnel(data.location_category || '') && (
            <motion.div {...fade} key="tunnel-loc">
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

    </div>
  );
}
