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

const BUS_ACTIONS = [
  'Changing Lanes', 'Completion of Left Turn', 'Completion of Right Turn',
  'Leaving Bus Stop', 'Leaving Terminus', 'Merging Left', 'Merging Right',
  'Moving Forward', 'Moving from Curb', 'Moving in Front of Bus',
  'Moving in Traffic Circle', 'Moving into Bus Stop', 'Moving into Terminus',
  'Moving Left of Bus', 'Moving Left to Right', 'Moving on Left Bend',
  'Moving on Right Bend', 'Moving Right of Bus', 'Moving Right to Left',
  'Moving Straight', 'Parked', 'Passing Left', 'Passing Right',
  'Reversing', 'Rolling Backward', 'Rolling Forward', 'Stopped', 'Stopping',
  'Turning Left', 'Turning Right', 'U-Turn',
].map(v => ({ value: v, label: v }));

const BUS_IMPACT = [
  'Bike Rack', "Driver's Side Mirror", 'Front Impact', 'Front/Rear Wheel',
  'Left Side Impact', 'Left Sideswipe', 'Passenger Side Mirror',
  'Rear Impact', 'Right Side Impact', 'Right Sideswipe', 'Top', 'Underbody',
].map(v => ({ value: v, label: v }));

const RUNAWAY_OPERATOR = [
  'Operator not in vehicle', 'Operator in vehicle',
].map(v => ({ value: v, label: v }));

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
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export function BusCollisionDetailsSection({ data, onUpdate }: Props) {
  return (
    <div className="space-y-5">
      {/* Collision Details */}
      <Card title="Collision details" complete={!!(data.collision_type && data.bus_action && data.point_of_impact)}>
        <Field label="Event type with" required>
          <CustomSelect value={data.collision_type || ''} onChange={v => onUpdate({ collision_type: v })} options={EVENT_TYPE_WITH} placeholder="Select collision type" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Bus action at time of event" required>
            <CustomSelect value={data.bus_action || ''} onChange={v => onUpdate({ bus_action: v })} options={BUS_ACTIONS} placeholder="Select action" />
          </Field>
          <Field label="Point of impact" required>
            <CustomSelect value={data.point_of_impact || ''} onChange={v => onUpdate({ point_of_impact: v })} options={BUS_IMPACT} placeholder="Select impact point" />
          </Field>
          <Field label="Bus speed at time of event (mph)">
            <input type="number" min={0} max={90} value={data.bus_speed || ''} onChange={e => onUpdate({ bus_speed: e.target.value })} placeholder="0" className={inputCls} />
          </Field>
        </div>

        {/* Visual impact diagram */}
        <div className="pt-1">
          <VehicleImpactDiagram
            markers={data.impact_markers || []}
            onChange={markers => onUpdate({ impact_markers: markers })}
          />
        </div>

        <Field label="Was there visible bus damage at the scene?">
          <YesNoToggle value={data.bus_damage} onChange={v => onUpdate({ bus_damage: v, bus_damage_confirmed: v ? data.bus_damage_confirmed : undefined })} />
        </Field>

        <AnimatePresence>
          {data.bus_damage === true && (
            <motion.div {...fade} key="bus-dmg-confirm">
              <Field label="Was the damage confirmed after inspection?">
                <YesNoToggle value={data.bus_damage_confirmed} onChange={v => onUpdate({ bus_damage_confirmed: v })} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Runaway & Evacuation */}
      <Card title="Runaway & evacuation" complete={data.runaway_vehicle !== undefined && data.evacuation_life_safety !== undefined}>
        <Field label="Did this event involve a runaway bus?">
          <YesNoToggle
            value={data.runaway_vehicle}
            onChange={v => onUpdate({ runaway_vehicle: v, operator_in_vehicle_runaway: undefined, parking_brake_engaged: undefined })}
          />
        </Field>

        <AnimatePresence>
          {data.runaway_vehicle === true && (
            <motion.div {...fade} key="runaway-detail" className="space-y-4">
              <Field label="Was the operator in the vehicle when the bus ran away?">
                <CustomSelect value={data.operator_in_vehicle_runaway || ''} onChange={v => onUpdate({ operator_in_vehicle_runaway: v })} options={RUNAWAY_OPERATOR} placeholder="Select" />
              </Field>
              <Field label="Was the parking brake engaged?">
                <YesNoToggle value={data.parking_brake_engaged} onChange={v => onUpdate({ parking_brake_engaged: v })} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Did this event involve an evacuation for life safety reasons?">
          <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
        </Field>
      </Card>
    </div>
  );
}
