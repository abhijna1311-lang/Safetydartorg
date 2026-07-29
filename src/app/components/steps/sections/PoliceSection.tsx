import { AnimatePresence, motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
}

const POLICE_TYPE = ['DART', 'Other'].map(v => ({ value: v, label: v }));
const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}</label>
      {children}
    </div>
  );
}

export function PoliceSection({ data, onUpdate }: Props) {
  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${data.police_at_scene !== undefined ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <Shield className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">Police section</h3>
        <span className="ml-auto text-xs text-slate-400 font-['Poppins'] italic">Not required</span>
      </div>
      <div className="px-6 py-5 space-y-4">

        <Field label="Were police at the scene?">
          <YesNoToggle
            value={data.police_at_scene}
            onChange={v => onUpdate({ police_at_scene: v, police_type: undefined })}
          />
        </Field>

        <AnimatePresence>
          {data.police_at_scene === true && (
            <motion.div {...fade} key="police-type">
              <Field label="If yes, whose police were they?">
                <CustomSelect value={data.police_type || ''} onChange={v => onUpdate({ police_type: v })} options={POLICE_TYPE} placeholder="Select" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Was a DART supervisor investigating?">
          <YesNoToggle value={data.dart_supervisor_investigating} onChange={v => onUpdate({ dart_supervisor_investigating: v })} />
        </Field>

      </div>
    </div>
  );
}
