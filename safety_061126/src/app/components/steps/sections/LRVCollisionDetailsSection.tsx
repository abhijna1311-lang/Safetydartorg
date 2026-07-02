import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { VehicleImpactDiagram } from '../../VehicleImpactDiagram';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
}

// ── option lists ──────────────────────────────────────────────────────────────
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

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const inputCls = "w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] focus:border-[#00205B] bg-white text-slate-800 placeholder:text-slate-400 transition-all min-h-[44px] font-['Poppins'] text-sm";

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-[#007DBA]' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export function LRVCollisionDetailsSection({ data, onUpdate }: Props) {
  return (
    <div className="space-y-5">
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
