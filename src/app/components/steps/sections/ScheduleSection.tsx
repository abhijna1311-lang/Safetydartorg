import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { CustomSelect } from '../../CustomSelect';
import type { AccidentReportData } from '../../../types/accident-report';

const RDO_CONSECUTIVE = ['Sun/Mon', 'Mon/Tue', 'Tue/Wed', 'Wed/Thu', 'Thu/Fri', 'Fri/Sat', 'Sat/Sun'].map((v) => ({ value: v, label: v }));
const RDO_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RDO_DAYS = RDO_DAY_NAMES.map((v) => ({ value: v, label: v }));

export function areSplitDaysValid(day1?: string, day2?: string) {
  if (!day1 || !day2) return false;
  const firstIndex = RDO_DAY_NAMES.indexOf(day1);
  const secondIndex = RDO_DAY_NAMES.indexOf(day2);
  if (firstIndex < 0 || secondIndex < 0) return false;
  const distance = Math.abs(firstIndex - secondIndex);
  return distance !== 0 && distance !== 1 && distance !== RDO_DAY_NAMES.length - 1;
}

function splitDayOptions(otherDay?: string) {
  if (!otherDay) return RDO_DAYS;
  return RDO_DAYS.filter(({ value }) => areSplitDaysValid(value, otherDay));
}

export function hasScheduleAnswers(data: AccidentReportData) {
  if (data.is_student_employee === undefined) return false;
  if (!data.regular_day_off_type) return false;
  if (data.regular_day_off_type === 'Consecutive') {
    return !!data.rdo_consecutive;
  }
  return areSplitDaysValid(data.rdo_split_1, data.rdo_split_2);
}

const layoutSpring = { type: 'spring' as const, stiffness: 500, damping: 40 };

interface ScheduleSectionProps {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  showErrors: boolean;
}

export function ScheduleSection({ data, onUpdate, showErrors }: ScheduleSectionProps) {
  const splitDaysAreValid = areSplitDaysValid(data.rdo_split_1, data.rdo_split_2);
  const errStudentEmployee = showErrors && data.is_student_employee === undefined;
  const errRegularDayOff = showErrors && !data.regular_day_off_type;
  const errSplitDays = showErrors && data.regular_day_off_type === 'Split' && !splitDaysAreValid;

  // When picking Day 1, drop Day 2 if the new pair would be invalid.
  const handleSplitDay1Change = (value: string) => {
    onUpdate({
      rdo_split_1: value,
      rdo_split_2: data.rdo_split_2 && !areSplitDaysValid(value, data.rdo_split_2) ? undefined : data.rdo_split_2,
    });
  };

  const handleSplitDay2Change = (value: string) => {
    onUpdate({
      rdo_split_2: value,
      rdo_split_1: data.rdo_split_1 && !areSplitDaysValid(data.rdo_split_1, value) ? undefined : data.rdo_split_1,
    });
  };

  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Schedule</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 font-['Poppins']">Confirm the operator's schedule details.</p>
      </div>

      <div className="dart-schedule-row">
          <motion.div layout transition={layoutSpring}>
            <p className="dart-field-label">Student employee? <span className="dart-req">*</span></p>
            <div className={`dart-seg ${errStudentEmployee ? 'dart-field-error' : ''}`}>
              <button type="button" onClick={() => onUpdate({ is_student_employee: true })} className={`dart-seg-btn ${data.is_student_employee === true ? 'dart-seg-btn--on' : ''}`}>
                {data.is_student_employee === true && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}Yes
              </button>
              <button type="button" onClick={() => onUpdate({ is_student_employee: false })} className={`dart-seg-btn ${data.is_student_employee === false ? 'dart-seg-btn--on' : ''}`}>
                {data.is_student_employee === false && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}No
              </button>
            </div>
          </motion.div>

          <motion.div layout transition={layoutSpring}>
            <p className="dart-field-label">Regular day off <span className="dart-req">*</span></p>
            <div className={`dart-seg ${errRegularDayOff ? 'dart-field-error' : ''}`}>
              <button type="button" onClick={() => onUpdate({ regular_day_off_type: 'Consecutive', rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })} className={`dart-seg-btn ${data.regular_day_off_type === 'Consecutive' ? 'dart-seg-btn--on' : ''}`}>
                {data.regular_day_off_type === 'Consecutive' && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}Consecutive days
              </button>
              <button type="button" onClick={() => onUpdate({ regular_day_off_type: 'Split', rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })} className={`dart-seg-btn ${data.regular_day_off_type === 'Split' ? 'dart-seg-btn--on' : ''}`}>
                {data.regular_day_off_type === 'Split' && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}Split days
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {data.regular_day_off_type === 'Consecutive' && (
              <motion.div
                layout
                key="sched-rdo-consec"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
              >
                <label className="dart-field-label">Regular days off (RDO) – Consecutive <span className="dart-req">*</span></label>
                <CustomSelect value={data.rdo_consecutive || ''} onChange={(v) => onUpdate({ rdo_consecutive: v })} options={RDO_CONSECUTIVE} placeholder="Select RDO pair" error={showErrors && !data.rdo_consecutive} />
              </motion.div>
            )}
            {data.regular_day_off_type === 'Split' && (
              <motion.div
                layout
                key="sched-rdo-1"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
              >
                <label className="dart-field-label">RDO Split – Day 1 <span className="dart-req">*</span></label>
                <CustomSelect value={data.rdo_split_1 || ''} onChange={handleSplitDay1Change} options={splitDayOptions(data.rdo_split_2)} placeholder="Select day" error={errSplitDays} />
              </motion.div>
            )}
            {data.regular_day_off_type === 'Split' && (
              <motion.div
                layout
                key="sched-rdo-2"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
              >
                <label className="dart-field-label">RDO Split – Day 2 <span className="dart-req">*</span></label>
                <CustomSelect value={data.rdo_split_2 || ''} onChange={handleSplitDay2Change} options={splitDayOptions(data.rdo_split_1)} placeholder="Select day" error={errSplitDays} />
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {data.regular_day_off_type === 'Split' && (
        <p className={`mt-2 text-xs font-['Poppins'] ${errSplitDays ? 'font-medium text-red-600' : 'text-slate-500'}`}>
          Split days must be different and cannot be consecutive.
        </p>
      )}
    </section>
  );
}
