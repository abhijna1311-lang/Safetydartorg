import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import type { AccidentReportData, PedestrianRecord } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
}

const PED_TYPE = ['On Foot/Wheelchair/Walker/Cane/Crutches', 'Using Micro Mobility'].map(v => ({ value: v, label: v }));
const PED_ACTION_FOOT = ['Jogging/Running', 'Laying', 'Mobility Assistance', 'Sitting', 'Standing', 'Walking'].map(v => ({ value: v, label: v }));
const PED_ACTION_MOBILITY = ['Changing Lanes', 'Going Backwards', 'Going Straight', 'Making a Left Turn', 'Making a Right Turn', 'Negotiating a curve', 'Stopped'].map(v => ({ value: v, label: v }));

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

export function PedestrianInjurySection({ data, onUpdate }: Props) {
  const groups: PedestrianRecord[] = data.pedestrian_groups || [];
  const count = data.pedestrians_involved ?? 0;
  const injuries = data.pedestrian_injuries ?? 0;

  const syncGroups = (newCount: number) => {
    const existing = [...groups];
    if (newCount > existing.length) {
      for (let i = existing.length; i < newCount; i++) {
        existing.push({ id: `ped-${Date.now()}-${i}` });
      }
    } else {
      existing.splice(newCount);
    }
    onUpdate({ pedestrians_involved: newCount, pedestrian_groups: existing });
  };

  const updateGroup = (id: string, patch: Partial<PedestrianRecord>) => {
    onUpdate({ pedestrian_groups: groups.map(g => g.id === id ? { ...g, ...patch } : g) });
  };

  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${count > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">Pedestrian injury section</h3>
      </div>
      <div className="px-6 py-5 space-y-5">

        <Field label="Number of pedestrians involved">
          <input
            type="number" min={1}
            value={count || ''}
            onChange={e => syncGroups(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="Enter count" className={inputCls}
          />
          {count > 0 && <p className="mt-1 text-xs text-[#007DBA] font-['Poppins']">Enter details for each pedestrian below.</p>}
        </Field>

        <AnimatePresence>
          {groups.map((ped, idx) => {
            const actionOpts = ped.pedestrian_type === 'Using Micro Mobility' ? PED_ACTION_MOBILITY : PED_ACTION_FOOT;
            return (
              <motion.div {...fade} key={ped.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/40">
                <p className="text-sm font-semibold text-slate-700 font-['Poppins']">Pedestrian {idx + 1}</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Pedestrian type">
                    <CustomSelect
                      value={ped.pedestrian_type || ''}
                      onChange={v => updateGroup(ped.id, { pedestrian_type: v, pedestrian_action: undefined })}
                      options={PED_TYPE} placeholder="Select type"
                    />
                  </Field>
                  <Field label="Pedestrian action">
                    <CustomSelect
                      value={ped.pedestrian_action || ''}
                      onChange={v => updateGroup(ped.id, { pedestrian_action: v })}
                      options={actionOpts} placeholder="Select action"
                    />
                  </Field>
                  <div className="col-span-2">
                    <label className="dart-field-label">Did this pedestrian flee the scene?</label>
                    <div className="flex gap-3">
                      {[true, false].map(val => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => updateGroup(ped.id, { fled: val })}
                          className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-['Poppins'] transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] ${ped.fled === val ? 'border-[#00205B] bg-[#EAF1F8] text-[#00205B] font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {count > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Field label="Number of pedestrian fatalities">
              <input type="number" min={0} value={data.pedestrian_fatalities ?? ''} onChange={e => onUpdate({ pedestrian_fatalities: parseInt(e.target.value) || 0 })} placeholder="Enter count" className={inputCls} />
            </Field>
            <Field label="Number of pedestrian injuries">
              <input
                type="number" min={0}
                value={data.pedestrian_injuries ?? ''}
                onChange={e => onUpdate({ pedestrian_injuries: parseInt(e.target.value) || 0 })}
                placeholder="Enter count" className={inputCls}
              />
            </Field>
            <Field label="Number of pedestrians who fled">
              <input type="number" min={0} value={data.pedestrians_fled ?? ''} onChange={e => onUpdate({ pedestrians_fled: parseInt(e.target.value) || 0 })} placeholder="Enter count" className={inputCls} />
            </Field>
            {injuries > 0 && (
              <Field label="Number of pedestrians transported to hospital">
                <input type="number" min={0} value={data.pedestrians_transported ?? ''} onChange={e => onUpdate({ pedestrians_transported: parseInt(e.target.value) || 0 })} placeholder="Enter count" className={inputCls} />
              </Field>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
