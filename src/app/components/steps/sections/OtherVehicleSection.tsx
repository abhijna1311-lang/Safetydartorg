import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import type { AccidentReportData, ThirdVehicleData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
}

const NON_DART_TYPES = [
  '18 Wheel Truck (Semi)', 'Commercial Rail or Amtrak', 'Delivery Truck/Van',
  'Fire Engine, Ambulance, Police car', 'Motorcycle/Moped', 'Passenger Auto/St Wagon',
  'Passenger Truck/SUV', 'School Bus/Charter/Tour Bus', 'Taxi/Rideshare',
  'Tractor Trailer', 'Trolley', 'Utility Trucks',
  'Wrecker/Tow Truck/Electric Utility Cart/Garbage Truck/Forklift',
].map(v => ({ value: v, label: v }));

const DART_TYPES = [
  'Bus', 'Hi-Rail – Maintenance vehicle mounted to rail', 'Light rail vehicle',
  'Motorcycle/Moped', 'Non-Revenue Rail vehicle (Maintenance)', 'Passenger Auto/St Wagon',
  'Passenger Truck/Van', 'Streetcar',
  'Wrecker/Tow Truck/Electric Utility cart/Garbage Truck/Forklift',
].map(v => ({ value: v, label: v }));

const VEHICLE_ACTION = [
  'Changing lanes', 'Going Backwards', 'Going Straight', 'Making a left turn',
  'Making a right turn', 'Negotiating a curve', 'Parked', 'Stopped',
].map(v => ({ value: v, label: v }));

const IMPACT = [
  "Driver Side Mirror", 'Front Impact', 'Front/Rear Wheel', 'Left Side Impact',
  'Passenger Side Mirror', 'Rear Impact', 'Right Side Impact',
  'Roof/Top of vehicle', 'Sideswipe', 'Underbody',
].map(v => ({ value: v, label: v }));

const DIRECTION = [
  'Approaching ahead or passing', 'Approaching at an angle from the left',
  'Approaching at an angle from the right', 'Moving facing the opposite direction',
  'Not moving ahead of DART Vehicle', 'Not moving on the left side of DART vehicle',
  'Not moving on the right side of DART vehicle',
  'Traveling in the same direction ahead of DART vehicle',
  'Traveling in the same direction behind DART vehicle',
  'Traveling the same direction beside DART vehicle',
].map(v => ({ value: v, label: v }));

const DAMAGE_AREA = ['Front', 'Front Wheel', 'Left Side', 'Rear', 'Rear Wheel', 'Right Side', 'Top', 'Underbody'].map(v => ({ value: v, label: v }));
const TOW_AWAY = ['Yes', 'No', 'Unknown'].map(v => ({ value: v, label: v }));

const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };
const inputCls = "dart-input-base";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}</label>
      {children}
    </div>
  );
}

function VehicleBlock({
  title,
  occupants, onOccupants,
  fatalities, onFatalities,
  injuries, onInjuries,
  fled, onFled,
  transported, onTransported,
  dartCollision, onDartCollision,
  vehicleType, onVehicleType,
  action, onAction,
  pointOfImpact, onImpact,
  direction, onDirection,
  damage, onDamage,
  damageArea, onDamageArea,
  towAway, onTowAway,
}: any) {
  const hasOccupants = (occupants ?? 0) > 0;
  const hasInjuries = (injuries ?? 0) > 0;
  const typeOptions = dartCollision ? DART_TYPES : NON_DART_TYPES;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-700 font-['Poppins']">{title}</p>
      </div>
      <div className="p-5 space-y-4">
        <Field label="Number of occupants">
          <input type="number" min={0} value={occupants ?? ''} onChange={e => onOccupants(parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
        </Field>

        <AnimatePresence>
          {hasOccupants && (
            <motion.div {...fade} key="occ-fields" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fatalities in this vehicle">
                  <input type="number" min={0} value={fatalities ?? ''} onChange={e => onFatalities(parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Injuries in this vehicle">
                  <input type="number" min={0} value={injuries ?? ''} onChange={e => onInjuries(parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Occupants who fled the scene">
                  <input type="number" min={0} value={fled ?? ''} onChange={e => onFled(parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
                </Field>
                {hasInjuries && (
                  <Field label="Occupants transported to hospital">
                    <input type="number" min={0} value={transported ?? ''} onChange={e => onTransported(parseInt(e.target.value) || 0)} placeholder="0" className={inputCls} />
                  </Field>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Was this a collision between DART vehicles?">
          <YesNoToggle value={dartCollision} onChange={v => { onDartCollision(v); onVehicleType(''); }} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Vehicle type">
            <CustomSelect value={vehicleType || ''} onChange={onVehicleType} options={typeOptions} placeholder="Select type" />
          </Field>
          <Field label="Vehicle action">
            <CustomSelect value={action || ''} onChange={onAction} options={VEHICLE_ACTION} placeholder="Select action" />
          </Field>
          <Field label="Point of impact">
            <CustomSelect value={pointOfImpact || ''} onChange={onImpact} options={IMPACT} placeholder="Select" />
          </Field>
          <Field label="Direction relative to DART vehicle">
            <CustomSelect value={direction || ''} onChange={onDirection} options={DIRECTION} placeholder="Select direction" />
          </Field>
        </div>

        <Field label="Was there damage to this vehicle?">
          <YesNoToggle value={damage} onChange={v => { onDamage(v); if (!v) onDamageArea(''); }} />
        </Field>

        <AnimatePresence>
          {damage === true && (
            <motion.div {...fade} key="dmg-area">
              <Field label="Damage area">
                <CustomSelect value={damageArea || ''} onChange={onDamageArea} options={DAMAGE_AREA} placeholder="Select area" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Tow away?">
          <CustomSelect value={towAway || ''} onChange={onTowAway} options={TOW_AWAY} placeholder="Select" />
        </Field>
      </div>
    </div>
  );
}

export function OtherVehicleSection({ data, onUpdate }: Props) {
  const thirdV = data.third_vehicle || {};
  const updateThird = (patch: Partial<ThirdVehicleData>) => onUpdate({ third_vehicle: { ...thirdV, ...patch } });

  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${data.other_vehicle_type ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">Other vehicle section</h3>
      </div>
      <div className="px-6 py-5 space-y-5">

        <VehicleBlock
          title="Other vehicle #2"
          occupants={data.other_vehicle_occupants} onOccupants={(v: number) => onUpdate({ other_vehicle_occupants: v })}
          fatalities={data.other_vehicle_fatalities} onFatalities={(v: number) => onUpdate({ other_vehicle_fatalities: v })}
          injuries={data.other_vehicle_injuries} onInjuries={(v: number) => onUpdate({ other_vehicle_injuries: v })}
          fled={data.other_vehicle_fled} onFled={(v: number) => onUpdate({ other_vehicle_fled: v })}
          transported={data.other_vehicle_transported} onTransported={(v: number) => onUpdate({ other_vehicle_transported: v })}
          dartCollision={data.dart_dart_collision} onDartCollision={(v: boolean) => onUpdate({ dart_dart_collision: v })}
          vehicleType={data.other_vehicle_type} onVehicleType={(v: string) => onUpdate({ other_vehicle_type: v })}
          action={data.other_vehicle_action} onAction={(v: string) => onUpdate({ other_vehicle_action: v })}
          pointOfImpact={data.other_vehicle_point_of_impact} onImpact={(v: string) => onUpdate({ other_vehicle_point_of_impact: v })}
          direction={data.other_vehicle_direction} onDirection={(v: string) => onUpdate({ other_vehicle_direction: v })}
          damage={data.other_vehicle_damage} onDamage={(v: boolean) => onUpdate({ other_vehicle_damage: v })}
          damageArea={data.other_vehicle_damage_area} onDamageArea={(v: string) => onUpdate({ other_vehicle_damage_area: v })}
          towAway={data.other_vehicle_tow_away} onTowAway={(v: string) => onUpdate({ other_vehicle_tow_away: v })}
        />

        {/* Third vehicle */}
        <div className="pt-2">
          <Field label="Was there a third vehicle involved?">
            <YesNoToggle value={data.third_vehicle_involved} onChange={v => onUpdate({ third_vehicle_involved: v, third_vehicle_collided: undefined, third_vehicle: undefined })} />
          </Field>
        </div>

        <AnimatePresence>
          {data.third_vehicle_involved === true && (
            <motion.div {...fade} key="third-v" className="space-y-4">
              <Field label="Did the third vehicle collide with the DART vehicle?">
                <YesNoToggle value={data.third_vehicle_collided} onChange={v => onUpdate({ third_vehicle_collided: v })} />
              </Field>

              {data.third_vehicle_collided === true && (
                <motion.div {...fade} key="third-v-block">
                  <VehicleBlock
                    title="Other vehicle #3"
                    occupants={thirdV.occupants} onOccupants={(v: number) => updateThird({ occupants: v })}
                    fatalities={thirdV.fatalities} onFatalities={(v: number) => updateThird({ fatalities: v })}
                    injuries={thirdV.injuries} onInjuries={(v: number) => updateThird({ injuries: v })}
                    fled={thirdV.fled} onFled={(v: number) => updateThird({ fled: v })}
                    transported={thirdV.transported} onTransported={(v: number) => updateThird({ transported: v })}
                    dartCollision={thirdV.dart_collision} onDartCollision={(v: boolean) => updateThird({ dart_collision: v })}
                    vehicleType={thirdV.type} onVehicleType={(v: string) => updateThird({ type: v })}
                    action={thirdV.action} onAction={(v: string) => updateThird({ action: v })}
                    pointOfImpact={thirdV.point_of_impact} onImpact={(v: string) => updateThird({ point_of_impact: v })}
                    direction={thirdV.direction} onDirection={(v: string) => updateThird({ direction: v })}
                    damage={thirdV.damage} onDamage={(v: boolean) => updateThird({ damage: v })}
                    damageArea={thirdV.damage_area} onDamageArea={(v: string) => updateThird({ damage_area: v })}
                    towAway={thirdV.tow_away} onTowAway={(v: string) => updateThird({ tow_away: v })}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
