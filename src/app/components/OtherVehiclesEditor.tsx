import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { YesNoToggle } from './form/YesNoToggle';
import type { OtherVehicle } from '../types/accident-report';

const opt = (arr: string[]) => arr.map(v => ({ value: v, label: v }));

// Vehicle type list changes depending on whether this was a DART-to-DART collision.
const TYPES_DART = opt([
  'Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van',
  'Non-Revenue Rail vehicle (Maintenance)', 'Hi-Rail – Maintenance vehicle mounted to rail',
  'Light rail vehicle', 'Streetcar', 'Bus',
  'Wrecker/Tow Truck/Electric Utility cart/ Garbage Truck/Forklift',
]);
const TYPES_NON_DART = opt([
  'Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van', 'Delivery Truck/Van',
  '18 Wheel Truck (Semi)', 'Fire Engine, Ambulance, Police car', 'Tractor Trailer',
  'Commercial Rail or Amtrak', 'School Bus/Charter/Tour Bus', 'Taxi/Rideshare',
  'Utility Trucks', 'Trolley', 'Wrecker/Tow Truck/Electric Utility cart/ Garbage Truck/Forklift',
]);
const ACTIONS = opt(['Going Straight', 'Making a left turn', 'Making a right turn', 'Going backwards', 'Changing lanes', 'Stopped', 'Negotiating a curve', 'Parked']);
const POINTS = opt(['Front Impact', 'Rear Impact', 'Sideswipe', 'Driver Side Mirror', 'Passenger Side Mirror', 'Left Side Impact', 'Right Side Impact', 'Roof/Top of vehicle', 'Underbody', 'Front/Rear Wheel']);
const DIRECTIONS = opt([
  'Traveling in the same direction ahead of DART vehicle',
  'Approaching at an angle from the left',
  'Approaching at an angle from the right',
  'Traveling in the same direction behind DART vehicle',
  'Approaching ahead or passing',
  'Moving facing the opposite direction',
  'Traveling the same direction beside DART vehicle',
  'Not moving on the left side of DART vehicle',
  'Not moving on the right side of DART vehicle',
  'Not moving ahead of DART Vehicle',
]);
const DAMAGE_AREAS = opt(['Front', 'Rear', 'Left Side', 'Right Side', 'Top', 'Underbody', 'Front Wheel', 'Rear Wheel']);

const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange, className = '' }: { label: string; value?: number; onChange: (v: number | undefined) => void; className?: string }) {
  return (
    <Field label={label} className={className}>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0))}
        placeholder="0"
        className="dart-input-base"
      />
    </Field>
  );
}

// Small eyebrow that titles each chunk of the editor.
function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 font-['Poppins']">{children}</p>;
}

// A stacked question row: label on the left, control on the right (matches the Police section).
function BoolRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface Props {
  vehicles: OtherVehicle[];
  onChange: (vehicles: OtherVehicle[]) => void;
}

export function OtherVehiclesEditor({ vehicles, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<OtherVehicle>) =>
    onChange(vehicles.map(v => (v.id === id ? { ...v, ...patch } : v)));

  const addVehicle = () => {
    const id = `vehicle-${Date.now()}`;
    onChange([...vehicles, { id }]);
    setOpenId(id);
  };

  const remove = (id: string) => {
    onChange(vehicles.filter(v => v.id !== id));
    if (openId === id) setOpenId(null);
  };

  // 0 or empty occupants clears the whole occupant breakdown.
  const setOccupants = (id: string, n: number | undefined) => {
    if (!n || n < 1) update(id, { occupants: n, fatalities: undefined, injuries: undefined, fled: undefined, transported: undefined });
    else update(id, { occupants: n });
  };
  // 0 injuries clears "transported" (can't transport an injured occupant if none are injured).
  const setInjuries = (id: string, n: number | undefined) => {
    if (!n || n < 1) update(id, { injuries: n, transported: undefined });
    else update(id, { injuries: n });
  };

  if (vehicles.length === 0) {
    return (
      <button
        type="button"
        onClick={addVehicle}
        className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center transition-colors hover:border-[#007DBA]/40 hover:bg-[#f2f8fc] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all group-hover:ring-[#007DBA]/30 group-hover:shadow-md">
          <span className="material-symbols-rounded text-[26px] text-[#007DBA]/70">directions_car</span>
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-700 font-['Poppins']">No other vehicles added</p>
        <p className="mt-1 text-xs text-slate-400 font-['Poppins']">Add each vehicle involved besides the DART vehicle.</p>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {vehicles.map((v, idx) => {
        const open = openId === v.id;
        const hasOccupants = (v.occupants ?? 0) > 0;
        const hasInjuries = (v.injuries ?? 0) > 0;
        const typeOptions = v.dart_dart ? TYPES_DART : TYPES_NON_DART;
        const subtitle = [v.vehicle_type || 'Type not set', `${v.occupants ?? 0} occ.`, v.damage ? 'damaged' : null, v.tow_away ? 'towed' : null].filter(Boolean).join(' · ');

        return (
          <div key={v.id} className={`overflow-hidden rounded-xl border bg-white transition-shadow ${open ? 'border-[#112458]/30 shadow-sm' : 'border-slate-200/70'}`}>
            {/* Summary row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#1c3570]">
                <span className="material-symbols-rounded text-[19px]">directions_car</span>
              </span>
              <button type="button" onClick={() => setOpenId(open ? null : v.id)} className="min-w-0 flex-1 text-left focus:outline-none">
                <p className="truncate text-sm font-semibold text-slate-800 font-['Poppins']">Vehicle {idx + 1}</p>
                <p className="truncate text-xs text-slate-500 font-['Poppins']">{subtitle}</p>
              </button>
              {hasInjuries && (
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 font-['Poppins']">{v.injuries} injured</span>
              )}
              <button type="button" onClick={() => setOpenId(open ? null : v.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.2)]" aria-label={open ? `Collapse vehicle ${idx + 1}` : `Edit vehicle ${idx + 1}`}>
                {open ? <Check className="h-4 w-4 text-emerald-600" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => remove(v.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label={`Remove vehicle ${idx + 1}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Inline editor */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="editor"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                  className="overflow-hidden border-t border-slate-100 bg-slate-50/40"
                >
                  <div className="space-y-6 px-4 py-5">
                    {/* Occupants */}
                    <div>
                      <GroupLabel>Occupants</GroupLabel>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                        <NumberField label="Number of occupants" value={v.occupants} onChange={n => setOccupants(v.id, n)} />
                        {hasOccupants && (
                          <>
                            <NumberField label="Occupant fatalities" value={v.fatalities} onChange={n => update(v.id, { fatalities: n })} />
                            <NumberField label="Occupant injuries" value={v.injuries} onChange={n => setInjuries(v.id, n)} />
                            <NumberField label="Occupants who fled the scene" value={v.fled} onChange={n => update(v.id, { fled: n })} />
                            {hasInjuries && (
                              <NumberField label="Occupants transported to hospital" value={v.transported} onChange={n => update(v.id, { transported: n })} />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div>
                      <GroupLabel>Vehicle</GroupLabel>
                      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/70 bg-white">
                        <BoolRow label="Was this a collision between DART vehicles?">
                          <YesNoToggle value={v.dart_dart} onChange={val => update(v.id, { dart_dart: val, vehicle_type: undefined })} />
                        </BoolRow>
                      </div>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                        <Field label="Vehicle type" className="sm:col-span-2">
                          <CustomSelect value={v.vehicle_type || ''} onChange={val => update(v.id, { vehicle_type: val })} options={typeOptions} placeholder="Select vehicle type" />
                        </Field>
                        <Field label="Vehicle action">
                          <CustomSelect value={v.action || ''} onChange={val => update(v.id, { action: val })} options={ACTIONS} placeholder="Select" />
                        </Field>
                        <Field label="Point of impact">
                          <CustomSelect value={v.point_of_impact || ''} onChange={val => update(v.id, { point_of_impact: val })} options={POINTS} placeholder="Select" />
                        </Field>
                        <Field label="Direction relative to DART vehicle" className="sm:col-span-2">
                          <CustomSelect value={v.direction || ''} onChange={val => update(v.id, { direction: val })} options={DIRECTIONS} placeholder="Select" />
                        </Field>
                      </div>
                    </div>

                    {/* Damage */}
                    <div>
                      <GroupLabel>Damage</GroupLabel>
                      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                        <BoolRow label="Was there damage to this vehicle?">
                          <YesNoToggle value={v.damage} onChange={val => update(v.id, { damage: val, damage_area: val ? v.damage_area : undefined })} />
                        </BoolRow>
                        {v.damage && (
                          <BoolRow label="Damage area">
                            <div className="w-full sm:w-60">
                              <CustomSelect value={v.damage_area || ''} onChange={val => update(v.id, { damage_area: val })} options={DAMAGE_AREAS} placeholder="Select" />
                            </div>
                          </BoolRow>
                        )}
                        <BoolRow label="Was this vehicle towed away?">
                          <YesNoToggle value={v.tow_away} onChange={val => update(v.id, { tow_away: val })} />
                        </BoolRow>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-slate-100 px-4 py-3">
                    <button type="button" onClick={() => setOpenId(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#112458] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c1a42] focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.3)] font-['Poppins']">
                      <Check className="h-4 w-4" /> Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addVehicle}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#007DBA]/40 bg-[#f2f8fc] px-3.5 py-2.5 text-sm font-semibold text-[#007DBA] transition-colors hover:border-[#007DBA] hover:bg-[#e8f3fa] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
      >
        <Plus className="h-4 w-4" /> Add vehicle
      </button>
    </div>
  );
}
