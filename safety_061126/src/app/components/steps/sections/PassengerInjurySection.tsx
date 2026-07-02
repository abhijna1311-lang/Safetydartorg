import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
}

const PASSENGER_ACTION = ['Boarding Bus', 'Alighting Bus', 'On Board'].map(v => ({ value: v, label: v }));
const DOOR = ['Front doors', 'Rear doors'].map(v => ({ value: v, label: v }));

const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

const inputCls = "w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] focus:border-[#00205B] bg-white text-slate-800 placeholder:text-slate-400 transition-all min-h-[44px] font-['Poppins'] text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}</label>
      {children}
    </div>
  );
}

export function PassengerInjurySection({ data, onUpdate }: Props) {
  const onBoard = (data.passengers_on_board ?? 0);
  const injured = (data.passengers_injured ?? 0);
  const showPassengerFields = onBoard >= 1;
  const showInjuryDetails = injured >= 1;
  const showWhichDoor = showInjuryDetails && (data.passenger_action === 'Boarding Bus' || data.passenger_action === 'Alighting Bus');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${data.passengers_on_board !== undefined ? 'bg-[#007DBA]' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">Passenger injury section</h3>
      </div>
      <div className="px-6 py-5 space-y-4">

        <Field label="Number of passengers on board">
          <input
            type="number" min={0}
            value={data.passengers_on_board ?? ''}
            onChange={e => {
              const n = parseInt(e.target.value) || 0;
              onUpdate({ passengers_on_board: n, ...(n < 1 ? { passenger_fatalities: undefined, passengers_injured: undefined, passenger_action: undefined, which_door: undefined, passengers_fled: undefined, courtesy_cards: undefined, passengers_transported: undefined } : {}) });
            }}
            placeholder="0" className={inputCls}
          />
        </Field>

        <AnimatePresence>
          {showPassengerFields && (
            <motion.div {...fade} key="pax-fields" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Number of passenger fatalities">
                  <input type="number" min={0} value={data.passenger_fatalities ?? ''} onChange={e => onUpdate({ passenger_fatalities: parseInt(e.target.value) || 0 })} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Number of passengers injured">
                  <input
                    type="number" min={0}
                    value={data.passengers_injured ?? ''}
                    onChange={e => {
                      const n = parseInt(e.target.value) || 0;
                      onUpdate({ passengers_injured: n, ...(n < 1 ? { passenger_action: undefined, which_door: undefined, courtesy_cards: undefined, passengers_transported: undefined } : {}) });
                    }}
                    placeholder="0" className={inputCls}
                  />
                </Field>
                <Field label="Number of passengers who fled the scene">
                  <input type="number" min={0} value={data.passengers_fled ?? ''} onChange={e => onUpdate({ passengers_fled: parseInt(e.target.value) || 0 })} placeholder="0" className={inputCls} />
                </Field>
              </div>

              {showInjuryDetails && (
                <motion.div {...fade} key="pax-injury" className="space-y-4">
                  <Field label="At the time of the event, the passenger was">
                    <CustomSelect value={data.passenger_action || ''} onChange={v => onUpdate({ passenger_action: v, which_door: undefined })} options={PASSENGER_ACTION} placeholder="Select" />
                  </Field>

                  {showWhichDoor && (
                    <motion.div {...fade} key="door">
                      <Field label="Which door?">
                        <CustomSelect value={data.which_door || ''} onChange={v => onUpdate({ which_door: v })} options={DOOR} placeholder="Select door" />
                      </Field>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Number of courtesy cards obtained">
                      <input type="number" min={0} value={data.courtesy_cards ?? ''} onChange={e => onUpdate({ courtesy_cards: parseInt(e.target.value) || 0 })} placeholder="0" className={inputCls} />
                    </Field>
                    <Field label="Number of passengers transported to hospital">
                      <input type="number" min={0} value={data.passengers_transported ?? ''} onChange={e => onUpdate({ passengers_transported: parseInt(e.target.value) || 0 })} placeholder="0" className={inputCls} />
                    </Field>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
