import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Bus, Car, CheckCircle2, ChevronDown, Download, Edit, FileText, PauseCircle, ShieldCheck, Train, TramFront, Truck, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { SmartCheckReviewBanner } from '../SmartCheckReviewBanner';
import { SubmissionSuccessInline } from '../SubmissionSuccessInline';
import { OperatorReportDrawer } from './sections/OperatorReportDrawer';
import { FLEET, BUS_STATUS_OPTIONS } from './sections/BusCollisionSection';
import { YesNoToggle } from '../form/YesNoToggle';
import { FormField } from '../form/FormField';
import { SearchableCombobox, type ComboboxOption } from '../SearchableCombobox';
import { CustomSelect } from '../CustomSelect';
import { DatePickerInput } from '../DatePickerInput';
import { TimePickerInput } from '../TimePickerInput';
import { SupervisorPersonListEditor } from '../SupervisorPersonListEditor';
import { PersonListEditor } from '../PersonListEditor';
import { PMPersonListEditor } from '../PMPersonListEditor';
import { ContributingFactorsPicker } from '../ContributingFactorsPicker';
import { OtherVehiclesEditor } from '../OtherVehiclesEditor';
import { VehicleImpactDiagram } from '../VehicleImpactDiagram';
import { PeopleImpactSummaryCard } from './sections/PeopleImpactSummaryCard';
import { LrvConsistFields } from './sections/LrvConsistFields';
import type { AccidentReportData, PMClassification, Person, PMInjuryBodyPart, PMInjuryRecord, PMInjurySeverity, PMPersonRecord, SupervisorDemographicRecord, SupervisorOtherVehicleRecord } from '../../types/accident-report';
import { useUserRole, type UserRole } from '../../context/UserRoleContext';
import { EMPLOYEE_DB } from '../../data/employeeDatabase';
import { BUS_STOP_OPTIONS } from '../../data/busStops';
import { type WorkflowSectionKey, type WorkflowSectionState, type WorkflowSectionStatus, type WorkflowSections } from '../../types/workflow-report';
import { PMReviewActionBar } from '../PMReviewActionBar';
import { ActionSelectionScreen } from '../actions/ActionSelectionScreen';
import { buildSpmActions, buildFsActions, buildOperatorActions } from '../actions/actionConfigs';

interface Step4Props {
  data: AccidentReportData;
  onUpdate: (data: Partial<AccidentReportData>) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onReturn?: () => void;
  onJumpToStep: (step: number) => void;
  submitLabel?: string;
  stageName?: string;
  nextRoleLabel?: string;
  returnTargetLabel?: string | null;
  isRoleAllowedToAdvance?: boolean;
  canReturn?: boolean;
  workflowStage?: 'initiation' | 'operator-completion' | 'supervisor-review' | 'program-manager-review' | 'closed';
  activeSectionKey?: WorkflowSectionKey;
  activeSectionStatus?: WorkflowSectionStatus;
  sectionStatuses?: WorkflowSections;
  initiatedBy?: UserRole;
  handoffNote?: string | null;
  returnTargetSection?: WorkflowSectionKey;
  returnableSections?: WorkflowSectionKey[];
  onReturnTargetSectionChange?: (value: WorkflowSectionKey) => void;
  returnReason?: string;
  onReturnReasonChange?: (value: string) => void;
  stepNumber?: number;
  totalSteps?: number;
  title?: string;
  description?: ReactNode;
  showStepBadge?: boolean;
  showBackButton?: boolean;
  showSuccessState?: boolean;
  submittedEventId?: string | null;
  onBackToHome?: () => void;
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  supervisorSectionStep?: number;
  supervisorSectionStepCount?: number;
  onSupervisorSectionStepChange?: (step: number) => void;
  programManagerSectionStep?: number;
  programManagerSectionStepCount?: number;
  onProgramManagerSectionStepChange?: (step: number) => void;
  /**
   * Fires whenever the Program Manager enters or leaves "Actions mode" —
   * i.e. after they confirm the accuracy checkbox on Review and click
   * Continue to next action, or Back from the Actions screen. The wizard
   * uses this to hide the section stepper and change the step description
   * so Actions reads as a distinct "choose next action" surface instead of
   * still looking like the Review step.
   */
  onProgramManagerActionsModeChange?: (inActionsMode: boolean) => void;
  /**
   * Same signal as onProgramManagerActionsModeChange, but for the Operator
   * final-review flow. The wizard uses it to hide the stepper and swap the
   * title/description into "Choose next action" mode.
   */
  onOperatorActionsModeChange?: (inActionsMode: boolean) => void;
  /** Same signal, for the Field Supervisor final-review flow. */
  onSupervisorActionsModeChange?: (inActionsMode: boolean) => void;
  // Program Manager reviewer action props
  pmReviewEnabled?: boolean;
  pmSupervisorSection?: WorkflowSectionState;
  pmOnOpenOperatorReport?: () => void;
  pmOnOpenSupervisorReport?: () => void;
  pmOnOpenActivity?: () => void;
  pmOnComment?: (note: string) => void;
  pmOnHold?: (note: string) => void;
  pmOnReturn?: (note: string) => void;
  pmOnReassign?: (payload: { toBadge: string; toName: string; note: string }) => void;
  pmOnReject?: (reason: string) => void;
  pmOnApproveAndClose?: (note: string) => void;
  pmOnResume?: () => void;
}

const SUPERVISOR_TEMPLATE_DOWNLOADS = [
  { label: 'Supervisor Layout Graph', href: '/templates/Supervisor-Layout-Graph.rtf' },
  { label: 'Supervisor Layout Graph 2', href: '/templates/Supervisor-Layout-Graph-2.rtf' },
];

const DEFAULT_SUPERVISOR_REVIEW_STEP_COUNT = 3;

const DART_VEHICLE_TYPE_OPTIONS = [
  { value: 'Bus', label: 'Bus', sublabel: 'Fixed route bus', icon: Bus },
  { value: 'Light Rail Vehicle', label: 'Light Rail', sublabel: 'Light rail vehicle', icon: Train },
  { value: 'Streetcar', label: 'Streetcar', sublabel: 'Urban streetcar', icon: TramFront },
  { value: 'Hi-Rail', label: 'Hi-Rail', sublabel: 'On-rail maintenance truck', icon: Truck },
  { value: 'Non-Revenue Vehicle', label: 'Non-Revenue', sublabel: 'Non-revenue vehicle', icon: Car },
] as const;

const BUS_VEHICLE_DB = [
  { id: '2045', label: '2045', type: '40 ft Low Floor', route: 'Route 15', tripId: 'T-20451' },
  { id: '3012', label: '3012', type: '60 ft Articulated', route: 'Route 22', tripId: 'T-30122' },
  { id: '1523', label: '1523', type: '35 ft Standard', route: 'Route 10', tripId: 'T-152310' },
  { id: '4089', label: '4089', type: '40 ft Hybrid', route: 'Route 201', tripId: 'T-4089201' },
  { id: '5201', label: '5201', type: '40 ft Low Floor', route: 'Route 5', tripId: 'T-52015' },
];

const RAIL_FLEET_DB = [
  { fleetType: 'KIN - Kinki Sharyo USA 1996', trainNumber: 'T-2045', carNumber: '2101', source: 'Maximo + Trapeze' },
  { fleetType: 'KIN - Kinki Sharyo USA 1998', trainNumber: 'T-2198', carNumber: '2234', source: 'Maximo + Trapeze' },
  { fleetType: 'KIN - Kinki Sharyo USA 1999', trainNumber: 'T-2332', carNumber: '2387', source: 'Maximo + Trapeze' },
  { fleetType: 'KIN - Kinki Sharyo USA 2005', trainNumber: 'T-2505', carNumber: '2518', source: 'Maximo + Trapeze' },
  { fleetType: 'KIN - Kinki Sharyo USA 2010', trainNumber: 'T-2710', carNumber: '2722', source: 'Maximo + Trapeze' },
];

function fmtSupDate(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${m}/${d}/${y}` : iso;
}
function fmtSupTime(val?: string) {
  if (!val) return '';
  const [hStr, mStr = '00'] = val.split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return val;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.padStart(2, '0')} ${period}`;
}

// Supervisor's read-only vehicle record — mirrors the operator's VehicleRecordCard (dart-vehicle-strip),
// reading the supervisor's own fields so the two roles get the identical "pulled from source" card.
function SupervisorVehicleRecordCard({ data }: { data: AccidentReportData }) {
  const cols = [
    { label: 'Fleet type', value: data.supervisor_fleet, glyph: 'directions_bus' },
    { label: 'Trip ID', value: data.supervisor_trip_id, glyph: 'route' },
    { label: 'Pull-out date', value: fmtSupDate(data.supervisor_employee_pullout_date), glyph: 'calendar_month' },
    { label: 'Pull-out time', value: fmtSupTime(data.supervisor_employee_pullout_time), glyph: 'schedule' },
    { label: 'End of line destination', value: data.supervisor_end_of_line_destination, glyph: 'flag' },
  ];
  return (
    <div className="dart-vehicle-strip">
      {cols.map(({ label, value, glyph }) => (
        <div key={label} className="dart-vehicle-item">
          <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">{glyph}</span></span>
          <div className="dart-vehicle-text">
            <span className="dart-vehicle-label">{label}</span>
            <span className="dart-vehicle-value dart-tabular">{value || '\u2014'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const REVEAL_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

const RAIL_LINE_OPTIONS = ['Blue', 'Green', 'Orange', 'Red', 'Streetcar'];
const RAIL_LOCATION_CATEGORY_OPTIONS = ['Rail Station', 'Right-of-way', 'Grade Crossing', 'Non-Revenue facility/Yard', 'Tunnel', 'Bridge'].map(value => ({ value, label: value }));
const TUNNEL_LOCATION_OPTIONS = Array.from({ length: 21 }, (_, index) => ({ value: `Cross Passage ${index + 1}`, label: `Cross Passage ${index + 1}` }));
const PROGRAM_MANAGER_COLLISION_WITH_OPTIONS = [
  'Collision – with Auto (All other vehicles except Transit, Emergency vehicle, Motorcycle)',
  'Collision – with Motorcycle/Scooter',
  'Collision – with Transit vehicle',
  'Collision – with Emergency vehicle',
  'Collision – with Pedestrian on Foot',
  'Collision – with Pedestrian Electric Scooter',
  'Collision – with Pedestrian Skateboarder/Hoverboard/Roller Skates',
  'Collision – with Pedestrian Crutches/Walker/Cane',
  'Collision – with Pedestrian Wheelchair',
  'Collision – with Pedestrian Scooter',
  'Collision – with Pedal Bicyclist',
  'Collision – with Electric Bicycle',
  'Collision – with Fixed Object',
  'Collision – with Non-Fixed Object',
  'Collision – with Animal',
].map(value => ({ value, label: value }));

const PROGRAM_MANAGER_COLLISION_TYPE_OPTIONS = [
  'Head On',
  'Sideswipe',
  'Rear-Ending',
  'Rear-Ended',
  'Other Front Impact',
  'Right Side Impact',
  'Left Side Impact',
  'Other Rear Impact',
  'Roof/top of vehicle',
].map(value => ({ value, label: value }));

const PROGRAM_MANAGER_DART_ACTION_OPTIONS = [
  'Going Straight',
  'Making a left turn',
  'Making a right turn',
  'Going backwards',
  'Changing lanes',
  'Stopped',
  'Negotiating a curve',
  'Parked',
].map(value => ({ value, label: value }));

const PROGRAM_MANAGER_DART_POINT_OF_IMPACT_OPTIONS = [
  'Front Impact',
  'Rear Impact',
  'Sideswipe',
  'Driver Side Mirror',
  'Passenger Side Mirror',
  'Left Side Impact',
  'Right Side Impact',
  'Roof/Top of vehicle',
  'Underbody',
  'Front/Rear Wheel',
].map(value => ({ value, label: value }));

const PROGRAM_MANAGER_DERAIL_CONFIG_OPTIONS = [
  'Switch',
  'Curve',
  'Tangent (Straight) Track',
  'Interlocking',
].map(value => ({ value, label: value }));

const PROGRAM_MANAGER_CLASSIFICATION_OPTIONS: { value: PMClassification; label: PMClassification }[] = [
  { value: 'Preventable', label: 'Preventable' },
  { value: 'Non-Preventable', label: 'Non-Preventable' },
  { value: 'Preventable Incident', label: 'Preventable Incident' },
  { value: 'Non-Preventable Incident', label: 'Non-Preventable Incident' },
  { value: 'Not Reportable', label: 'Not Reportable' },
];

const PM_TOW_AWAY_VEHICLE_OPTIONS = [
  { value: 'DART vehicle only', label: 'DART vehicle only' },
  { value: 'Other vehicle only', label: 'Other vehicle only' },
  { value: 'Both DART and other vehicle', label: 'Both DART and other vehicle' },
];

const PM_INJURY_SEVERITY_OPTIONS: PMInjurySeverity[] = ['Injured – Non-Serious', 'Injured - Serious'];
const PM_INJURY_BODY_PART_OPTIONS: PMInjuryBodyPart[] = ['Head', 'Upper body', 'Lower body'];
const AGE_GROUP_OPTIONS: NonNullable<SupervisorDemographicRecord['age_group']>[] = [
  'Child (12 and under)',
  'Teen (13 to 18)',
  'Adult (19 to 60)',
  'Senior Citizen (61 and up)',
];
const GENDER_OPTIONS: NonNullable<SupervisorDemographicRecord['gender']>[] = ['Female', 'Male'];

const OTHER_VEHICLE_ACTION_OPTIONS = [
  'Going Straight',
  'Making a left turn',
  'Making a right turn',
  'Going backwards',
  'Changing lanes',
  'Stopped',
  'Negotiating a curve',
  'Parked',
];

const OTHER_VEHICLE_POINT_OF_IMPACT_OPTIONS = [
  'Front Impact',
  'Rear Impact',
  'Sideswipe',
  'Driver Side Mirror',
  'Passenger Side Mirror',
  'Left Side Impact',
  'Right Side Impact',
  'Roof/Top of vehicle',
  'Underbody',
  'Front/Rear Wheel',
];

// DART vehicle point-of-impact options mirror the Operator's per-mode lists.
const SUP_BUS_IMPACT = [
  'Bike Rack', "Driver's Side Mirror", 'Front Impact', 'Front/Rear Wheel',
  'Left Side Impact', 'Left Sideswipe', 'Passenger Side Mirror',
  'Rear Impact', 'Right Side Impact', 'Right Sideswipe', 'Top', 'Underbody',
].map(v => ({ value: v, label: v }));
const SUP_LRV_IMPACT = [
  'Front Impact', 'Left Side Impact', 'Left Sideswipe', 'Rear Impact',
  'Right Side Impact', 'Right Side Sideswipe', 'Roof/Top of Vehicle', 'Underbody',
].map(v => ({ value: v, label: v }));
const SUP_NRV_IMPACT = SUP_BUS_IMPACT;

const OTHER_VEHICLE_DIRECTION_OPTIONS = [
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
];

const OTHER_VEHICLE_TYPES_WHEN_DART_COLLISION = [
  'Passenger Auto/St Wagon',
  'Motorcycle/Moped',
  'Passenger Truck/SUV',
  'Non-Revenue Rail vehicle (Maintenance)',
  'Hi-Rail - Maintenance vehicle mounted to rail',
  'Light rail vehicle',
  'Streetcar',
  'Bus',
  'Wrecker/Tow Truck/Electric Utility Cart/Garbage Truck/Forklift',
];

const OTHER_VEHICLE_TYPES_WHEN_NOT_DART_COLLISION = [
  'Passenger Auto/St Wagon',
  'Motorcycle/Moped',
  'Passenger Truck/SUV',
  'Delivery Truck/Van',
  '18 Wheel Truck (Semi)',
  'Fire Engine, Ambulance, Police car',
  'Tractor Trailer',
  'Commercial Rail or Amtrak',
  'School Bus/Charter/Tour Bus',
  'Taxi/Rideshare',
  'Utility Trucks',
  'Trolley',
  'Wrecker/Tow Truck/Electric Utility Cart/Garbage Truck/Forklift',
];

const FIELD_LABEL_CLASS = 'dart-field-label';
const INPUT_CLASS = 'dart-input-base';
const TEXTAREA_CLASS = 'dart-input-base resize-none';
const COMPACT_INPUT_CLASS = 'dart-input-compact';

function parseOptionalCount(value: string) {
  if (value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return Math.max(0, parsed);
}

function resizeDemographicRecords(records: SupervisorDemographicRecord[] | undefined, count?: number) {
  return Array.from({ length: Math.max(0, count || 0) }, (_, index) => records?.[index] || {});
}

function resizeOtherVehicleRecords(records: SupervisorOtherVehicleRecord[] | undefined, count?: number) {
  return Array.from({ length: Math.max(0, count || 0) }, (_, index) => records?.[index] || { id: `other-vehicle-${index + 2}` });
}

function resizePMInjuryRecords(records: PMInjuryRecord[] | undefined, count?: number) {
  return Array.from({ length: Math.max(0, count || 0) }, (_, index) => records?.[index] || {});
}

function YesNoButtons({ value, onChange }: { value?: boolean; onChange: (value: boolean) => void }) {
  return <YesNoToggle value={value} onChange={onChange} />;
}

function RevealPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      {...REVEAL_MOTION}
      className={`overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Inline yes/no row shared with the operator step so FS/SPM inherit the same feel.
const LAYOUT_SPRING = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;
const HEIGHT_REVEAL = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto' as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { height: LAYOUT_SPRING, opacity: { duration: 0.2, ease: 'easeInOut' as const } },
};

function BoolRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function DecisionGroup({ label, value, onChange, children, bare = false }: { label: string; value?: boolean; onChange: (value: boolean) => void; children?: ReactNode; bare?: boolean }) {
  return (
    <div className={bare ? '' : 'rounded-xl border border-slate-200/70 bg-white p-4'}>
      <div className={`flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${bare ? 'px-4 py-3.5 sm:py-3' : ''}`}>
        <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>{label}</div>
        <div className="shrink-0">
          <YesNoButtons value={value} onChange={onChange} />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {value && children && (
          bare ? (
            <motion.div
              key="bare-reveal"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }, opacity: { duration: 0.2, ease: 'easeInOut' } }}
              className="overflow-hidden border-t border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              {children}
            </motion.div>
          ) : (
            <RevealPanel className="mt-4">
              {children}
            </RevealPanel>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

function binaryChoiceClass(selected: boolean, value: 'yes' | 'no') {
  if (!selected) {
    return "border-slate-300 bg-white text-slate-700 hover:border-slate-400 text-sm font-medium font-['Poppins']";
  }

  if (value === 'yes') {
    return "border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-medium font-['Poppins']";
  }

  return "border-slate-400 bg-slate-100 text-slate-800 text-sm font-medium font-['Poppins']";
}

function formatReviewValue(value: string | number | boolean | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return 'Not entered';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function railLocationShowsStation(category: string) {
  return ['Rail Station', 'Grade Crossing', 'Bridge'].includes(category);
}

function railLocationShowsGrade(category: string) {
  return ['Grade Crossing', 'Bridge'].includes(category);
}

function railLocationShowsTunnel(category: string) {
  return category === 'Tunnel';
}

export function Step4ReviewSubmit({ 
  data, 
  onUpdate, 
  onBack, 
  onSaveDraft, 
  onSubmit, 
  onReturn,
  onJumpToStep,
  submitLabel = 'Submit section',
  stageName = 'Review and submit',
  nextRoleLabel,
  returnTargetLabel,
  isRoleAllowedToAdvance = true,
  canReturn = false,
  workflowStage = 'operator-completion',
  activeSectionKey = 'operator',
  activeSectionStatus = 'in-progress',
  sectionStatuses,
  initiatedBy = 'Operator',
  handoffNote = null,
  returnTargetSection = 'operator',
  returnableSections = [],
  onReturnTargetSectionChange,
  returnReason = '',
  onReturnReasonChange,
  stepNumber = 4,
  totalSteps = 4,
  title = 'Review',
  description,
  showStepBadge = true,
  showBackButton = true,
  showSuccessState = false,
  submittedEventId = null,
  onBackToHome,
  onNavigate,
  supervisorSectionStep,
  supervisorSectionStepCount = DEFAULT_SUPERVISOR_REVIEW_STEP_COUNT,
  onSupervisorSectionStepChange,
  programManagerSectionStep,
  programManagerSectionStepCount = 5,
  onProgramManagerSectionStepChange,
  onProgramManagerActionsModeChange,
  onOperatorActionsModeChange,
  onSupervisorActionsModeChange,
  pmReviewEnabled = false,
  pmSupervisorSection,
  pmOnOpenOperatorReport,
  pmOnOpenSupervisorReport,
  pmOnOpenActivity,
  pmOnComment,
  pmOnHold,
  pmOnReturn,
  pmOnReassign,
  pmOnReject,
  pmOnApproveAndClose,
  pmOnResume,
}: Step4Props) {
  const { roleConfig } = useUserRole();
  const [isDragging, setIsDragging] = useState(false);
  const [smartCheckState, setSmartCheckState] = useState<'default' | 'issues' | 'clear'>('default');
  const [smartCheckIssues, setSmartCheckIssues] = useState<Array<{ id: string; message: string }>>([]);
  const [isOperatorReportOpen, setIsOperatorReportOpen] = useState(false);
  const [supervisorSubStep1Attempted, setSupervisorSubStep1Attempted] = useState(false);
  const [pmClassifyAttempted, setPmClassifyAttempted] = useState(false);
  const [pmStep1Attempted, setPmStep1Attempted] = useState(false);
  const [pmInActionsMode, setPmInActionsMode] = useState(false);
  const [pmReviewConfirmed, setPmReviewConfirmed] = useState(false);
  const [pmConfirmedAction, setPmConfirmedAction] = useState<{ actionId: string; title: string; description: string } | null>(null);
  const [fsInActionsMode, setFsInActionsMode] = useState(false);
  const [fsConfirmedAction, setFsConfirmedAction] = useState<{ actionId: string; title: string; description: string } | null>(null);
  const [operatorInActionsMode, setOperatorInActionsMode] = useState(false);
  const [operatorConfirmedAction, setOperatorConfirmedAction] = useState<{ actionId: string; title: string; description: string } | null>(null);
  // One-shot warning shown before any role hands off Review → Actions. Records which role
  // was trying to advance so the confirm handler knows where to send them.
  const [pendingActionsRole, setPendingActionsRole] = useState<'operator' | 'supervisor' | 'programManager' | null>(null);
  const [localSupervisorReviewStep, setLocalSupervisorReviewStep] = useState(1);
  const [localPmReviewStep, setLocalPmReviewStep] = useState(1);
  const attachments = data.attachments || [];
  const isInitiationStage = workflowStage === 'initiation';
  const isSupervisorReview = activeSectionKey === 'supervisor';
  // The operator report only exists once the operator has actually filed. When a supervisor
  // initiates the case (operator waived or not yet filed), there is nothing to open.
  const operatorReportAvailable = ['submitted', 'resubmitted', 'accepted'].includes(sectionStatuses?.operator?.status ?? '');
  const supervisorReviewStep = supervisorSectionStep ?? localSupervisorReviewStep;
  const setSupervisorReviewStep = (step: number) => {
    const nextStep = Math.max(1, Math.min(supervisorSectionStepCount, step));
    if (onSupervisorSectionStepChange) {
      onSupervisorSectionStepChange(nextStep);
      return;
    }
    setLocalSupervisorReviewStep(nextStep);
  };
  const isProgramManagerReview = activeSectionKey === 'programManager';
  const pmReviewStep = programManagerSectionStep ?? localPmReviewStep;
  const setPmReviewStep = (step: number) => {
    const nextStep = Math.max(1, Math.min(programManagerSectionStepCount, step));
    if (onProgramManagerSectionStepChange) {
      onProgramManagerSectionStepChange(nextStep);
      return;
    }
    setLocalPmReviewStep(nextStep);
  };
  const isPmStep1 = isProgramManagerReview && pmReviewStep === 1;
  const isPmStep2 = isProgramManagerReview && pmReviewStep === 2;
  const isPmStep3 = isProgramManagerReview && pmReviewStep === 3;
  const isPmStep4 = isProgramManagerReview && pmReviewStep === 4;
  const isPmStep5 = isProgramManagerReview && pmReviewStep === 5;
  const isSectionAlreadySubmitted = activeSectionStatus === 'submitted' || activeSectionStatus === 'accepted';
  const showInlineReferenceSummaries = !isSupervisorReview && !isProgramManagerReview && !operatorInActionsMode;
  // The operator ends on a "choose next action" screen just like the FS and PM,
  // so we can transition to actions mode once they confirm the Review page.
  const isOperatorFinalReview = activeSectionKey === 'operator' && !isSupervisorReview && !isProgramManagerReview;
  const supervisorWorkdayRecord = roleConfig.role === 'Supervisor' ? EMPLOYEE_DB[roleConfig.badge] : undefined;
  // Vehicle mode is chosen once at Step 1 intake (data.mode). The supervisor section reads it from
  // there instead of asking again — falling back to any previously stored supervisor value (seeds).
  const supervisorVehicleType = data.supervisor_dart_vehicle_type || data.mode || '';
  const hasSupervisorVehicleType = Boolean(supervisorVehicleType);
  const supervisorVehicleIsHiRailOrNrv = supervisorVehicleType === 'Hi-Rail' || supervisorVehicleType === 'Non-Revenue Vehicle' || supervisorVehicleType === 'NRV';
  const supervisorVehicleIsRailMode = supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar' || supervisorVehicleType === 'Hi-Rail';
  const supervisorLocationUsesRail = supervisorVehicleIsRailMode;
  // Impact diagram variant + point-of-impact options driven by the vehicle mode captured in Step 1.
  const supervisorImpactVariant: 'bus' | 'rail' | 'streetcar' | 'nrv' =
    supervisorVehicleType === 'Light Rail Vehicle' ? 'rail'
    : supervisorVehicleType === 'Streetcar' ? 'streetcar'
    : supervisorVehicleType === 'Hi-Rail' || supervisorVehicleType === 'Non-Revenue Vehicle' || supervisorVehicleType === 'NRV' ? 'nrv'
    : 'bus';
  const supervisorImpactOptions = supervisorImpactVariant === 'rail' || supervisorImpactVariant === 'streetcar'
    ? SUP_LRV_IMPACT
    : supervisorImpactVariant === 'nrv' ? SUP_NRV_IMPACT : SUP_BUS_IMPACT;
  const supervisorLocationUsesStreet = hasSupervisorVehicleType && !supervisorLocationUsesRail;
  const showSupervisorRailStation = railLocationShowsStation(data.supervisor_location_category || '');
  const showSupervisorRailGrade = railLocationShowsGrade(data.supervisor_location_category || '');
  const showSupervisorRailTunnel = railLocationShowsTunnel(data.supervisor_location_category || '');
  const showSupervisorRevenueQuestion = hasSupervisorVehicleType && !supervisorVehicleIsHiRailOrNrv && supervisorVehicleType !== 'Bus';
  const showSupervisorRevenueFields = showSupervisorRevenueQuestion && data.supervisor_revenue_service === true;
  const showSupervisorRailLine = showSupervisorRevenueFields && (supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar');
  const showSupervisorDartTowCount = data.supervisor_dart_vehicle_damaged === true && data.supervisor_damage_requires_tow === true && (data.supervisor_damage_count || 0) > 0;
  const showSupervisorOtherVehicleTowCount = (data.supervisor_other_vehicle_damage_count || 0) > 0;
  const passengerFatalityRecords = resizeDemographicRecords(data.supervisor_passenger_fatality_details, data.supervisor_passenger_fatality_count);
  const passengerInjuryRecords = resizeDemographicRecords(data.supervisor_passenger_injury_details, data.supervisor_passenger_injury_count);
  const pedestrianFatalityRecords = resizeDemographicRecords(data.supervisor_pedestrian_fatality_details, data.supervisor_pedestrian_fatality_count);
  const pedestrianInjuryRecords = resizeDemographicRecords(data.supervisor_pedestrian_injury_details, data.supervisor_pedestrian_injury_count);
  const employeeFatalityRecords = resizeDemographicRecords(data.supervisor_dart_employee_fatality_details, data.supervisor_dart_employee_fatality_count);
  const employeeInjuryRecords = resizeDemographicRecords(data.supervisor_dart_employee_injury_details, data.supervisor_dart_employee_injury_count);
  // Person-list editor is source of truth; count fields stay in sync as list length so review screens still work.
  const applyPersonList = (
    detailField:
      | 'supervisor_dart_employee_fatality_details'
      | 'supervisor_dart_employee_injury_details'
      | 'supervisor_passenger_fatality_details'
      | 'supervisor_passenger_injury_details'
      | 'supervisor_pedestrian_fatality_details'
      | 'supervisor_pedestrian_injury_details',
    countField:
      | 'supervisor_dart_employee_fatality_count'
      | 'supervisor_dart_employee_injury_count'
      | 'supervisor_passenger_fatality_count'
      | 'supervisor_passenger_injury_count'
      | 'supervisor_pedestrian_fatality_count'
      | 'supervisor_pedestrian_injury_count',
    records: SupervisorDemographicRecord[]
  ) => {
    onUpdate({
      [detailField]: records,
      [countField]: records.length > 0 ? records.length : undefined,
    } as Partial<AccidentReportData>);
  };
  const otherVehicleRecords = resizeOtherVehicleRecords(data.supervisor_other_vehicle_records, data.supervisor_other_vehicle_count);
  const otherVehicleTypeOptions = data.supervisor_collision_between_dart_vehicles === true
    ? OTHER_VEHICLE_TYPES_WHEN_DART_COLLISION
    : OTHER_VEHICLE_TYPES_WHEN_NOT_DART_COLLISION;
  const supervisorBusVehicleOptions: ComboboxOption[] = BUS_VEHICLE_DB.map(vehicle => ({
    value: vehicle.id,
    label: vehicle.label,
    description: `${vehicle.type} • ${vehicle.route} • ${vehicle.tripId}`,
  }));
  const supervisorRailFleetOptions: ComboboxOption[] = RAIL_FLEET_DB.map(record => ({
    value: record.trainNumber,
    label: record.trainNumber,
    description: `${record.fleetType} • Car ${record.carNumber} • ${record.source}`,
  }));
  const confirmationChecked = isSupervisorReview
    ? Boolean(data.supervisor_confirmation_checked)
    : isProgramManagerReview
    ? Boolean(data.program_manager_confirmation_checked)
    : Boolean(data.confirmation_checked);
  const supervisorWentToScene = data.supervisor_went_to_scene === true;
  const supervisorDidNotGoToScene = data.supervisor_went_to_scene === false;
  const supervisorRequiredReviewItems = [
    { id: 'supervisor-went-to-scene', label: 'Did you go to the scene?', step: 1, missing: data.supervisor_went_to_scene === undefined },
    ...(supervisorWentToScene ? [
      { id: 'supervisor-arrival-date', label: 'Field Supervisor arrival date', step: 1, missing: !data.supervisor_arrival_date },
      { id: 'supervisor-arrival-time', label: 'Field Supervisor arrival time', step: 1, missing: !data.supervisor_arrival_time },
    ] : []),
    ...(supervisorDidNotGoToScene ? [
      { id: 'supervisor-no-scene-reason', label: 'Reason you did not go to the scene', step: 1, missing: !data.supervisor_no_scene_reason?.trim() },
    ] : []),
    ...(hasSupervisorVehicleType ? [
      { id: 'supervisor-vehicle-number', label: 'Vehicle number', step: 1, missing: !data.supervisor_vehicle_number },
      { id: 'supervisor-fleet', label: 'Fleet or asset type', step: 1, missing: !data.supervisor_fleet },
    ] : []),
    ...(supervisorLocationUsesStreet ? [
      { id: 'supervisor-street-on', label: 'Street on', step: 1, missing: !data.supervisor_street_on },
      { id: 'supervisor-city', label: 'City', step: 1, missing: !data.supervisor_city },
    ] : []),
    ...(supervisorLocationUsesRail ? [
      { id: 'supervisor-location-category', label: 'Location category', step: 1, missing: !data.supervisor_location_category },
    ] : []),
    { id: 'supervisor-event-description', label: 'Field Supervisor description of safety event', step: 1, missing: !data.supervisor_event_description },
  ].filter((item) => item.missing);

  // When the field supervisor tries to advance past sub-step 1 with required items missing,
  // we surface an inline error state on the fields themselves instead of deferring to review.
  const supervisorSubStep1MissingItems = supervisorSubStep1Attempted
    ? supervisorRequiredReviewItems.filter((item) => item.step === 1)
    : [];
  const supervisorSubStep1MissingIds = new Set(supervisorSubStep1MissingItems.map((item) => item.id));
  const supervisorWentToSceneError = supervisorSubStep1MissingIds.has('supervisor-went-to-scene');
  const supervisorNoSceneReasonError = supervisorSubStep1MissingIds.has('supervisor-no-scene-reason');
  const supervisorArrivalDateError = supervisorSubStep1MissingIds.has('supervisor-arrival-date');
  const supervisorArrivalTimeError = supervisorSubStep1MissingIds.has('supervisor-arrival-time');
  const supervisorEventDescriptionError = supervisorSubStep1MissingIds.has('supervisor-event-description');
  const supervisorDetailsReviewFields = [
    { label: 'Went to the scene', value: data.supervisor_went_to_scene === undefined ? '—' : (data.supervisor_went_to_scene ? 'Yes' : 'No'), required: true },
    ...(supervisorWentToScene ? [
      { label: 'Field Supervisor arrival date', value: formatReviewValue(data.supervisor_arrival_date), required: true },
      { label: 'Field Supervisor arrival time', value: formatReviewValue(data.supervisor_arrival_time), required: true },
    ] : []),
    ...(supervisorDidNotGoToScene ? [
      { label: 'Reason you did not go to the scene', value: formatReviewValue(data.supervisor_no_scene_reason), required: true },
    ] : []),
    ...(hasSupervisorVehicleType ? [
      { label: supervisorVehicleType === 'Bus' ? 'Bus vehicle number' : supervisorVehicleType === 'Streetcar' ? 'Streetcar number' : supervisorVehicleType === 'Light Rail Vehicle' ? 'LRV number involved in event' : 'Vehicle number', value: formatReviewValue(data.supervisor_vehicle_number), required: true },
      { label: supervisorVehicleType === 'Bus' ? 'Fleet type' : 'Fleet or asset type', value: formatReviewValue(data.supervisor_fleet), required: true },
    ] : []),
    ...(supervisorVehicleType === 'Bus' ? [
      { label: 'Trip ID', value: formatReviewValue(data.supervisor_trip_id) },
      { label: 'Employee pull-out date', value: formatReviewValue(data.supervisor_employee_pullout_date) },
      { label: 'Employee pull-out time', value: formatReviewValue(data.supervisor_employee_pullout_time) },
    ] : []),
    ...(supervisorVehicleType === 'Light Rail Vehicle' ? [
      { label: 'LRV fleet type', value: formatReviewValue(data.supervisor_lrv_fleet_type) },
      { label: 'LRVs in consist', value: formatReviewValue(data.supervisor_lrv_consist_count) },
      ...([data.supervisor_lrv_consist_2, data.supervisor_lrv_consist_3, data.supervisor_lrv_consist_4]
        .map((v, i) => ({ label: `LRV ${i + 2} number`, value: formatReviewValue(v) }))
        .filter((row, i) => (data.supervisor_lrv_consist_count ?? 0) >= i + 2)),
      { label: 'LRV pull-out date', value: formatReviewValue(data.supervisor_train_pullout_date) },
      { label: 'LRV pull-out time', value: formatReviewValue(data.supervisor_train_pullout_time) },
    ] : supervisorVehicleType === 'Streetcar' ? [
      { label: 'Streetcar fleet type', value: formatReviewValue(data.supervisor_lrv_fleet_type) },
      { label: 'Car number involved in event', value: formatReviewValue(data.supervisor_car_number) },
      { label: 'Streetcar pull-out date', value: formatReviewValue(data.supervisor_train_pullout_date) },
      { label: 'Streetcar pull-out time', value: formatReviewValue(data.supervisor_train_pullout_time) },
    ] : []),
    ...(showSupervisorRevenueQuestion ? [
      { label: 'Revenue service', value: formatReviewValue(data.supervisor_revenue_service) },
      ...(data.supervisor_revenue_service ? [
        { label: 'Operating route number', value: formatReviewValue(data.supervisor_operating_route_number) },
        { label: 'Block number', value: formatReviewValue(data.supervisor_block_number) },
        ...(showSupervisorRailLine ? [{ label: 'Rail line', value: formatReviewValue(data.supervisor_rail_line) }] : []),
      ] : []),
    ] : []),
    ...(supervisorLocationUsesStreet ? [
      { label: 'Street on', value: formatReviewValue(data.supervisor_street_on), required: true },
      { label: 'Cross street', value: formatReviewValue(data.supervisor_cross_street) },
      { label: 'City', value: formatReviewValue(data.supervisor_city), required: true },
      { label: 'ZIP code', value: formatReviewValue(data.supervisor_zip) },
    ] : []),
    ...(supervisorLocationUsesRail ? [
      { label: 'Location category', value: formatReviewValue(data.supervisor_location_category), required: true },
      ...(showSupervisorRailStation ? [{ label: 'Station', value: formatReviewValue(data.supervisor_station_applicable) }] : []),
      ...(showSupervisorRailGrade ? [{ label: 'Grade crossing', value: formatReviewValue(data.supervisor_grade_crossing_applicable) }] : []),
      ...(showSupervisorRailTunnel ? [{ label: 'Tunnel location', value: formatReviewValue(data.supervisor_tunnel_location) }] : []),
      { label: 'Address of event', value: formatReviewValue(data.supervisor_address_of_event), wide: true },
    ] : []),
    { label: 'Field Supervisor description', value: formatReviewValue(data.supervisor_event_description), required: true, wide: true },
    ...(supervisorVehicleIsRailMode ? [
      { label: 'Derailment confirmed', value: formatReviewValue(data.supervisor_derailment_confirmed) },
      ...(data.supervisor_derailment_confirmed ? [{ label: 'Derailment details', value: formatReviewValue(data.supervisor_derailment_details), wide: true }] : []),
    ] : []),
    { label: 'DART vehicle damaged', value: formatReviewValue(data.supervisor_dart_vehicle_damaged) },
    ...(data.supervisor_dart_vehicle_damaged ? [
      { label: 'DART vehicles damaged', value: formatReviewValue(data.supervisor_damage_count) },
      { label: 'Required a tow', value: formatReviewValue(data.supervisor_damage_requires_tow) },
      ...(data.supervisor_damage_requires_tow ? [{ label: 'DART vehicles towed', value: formatReviewValue(data.supervisor_tow_count) }] : []),
    ] : []),
    { label: 'Other vehicles involved', value: formatReviewValue(data.supervisor_other_vehicles_involved) },
    ...(data.supervisor_other_vehicles_involved ? [
      { label: 'Other vehicles involved count', value: formatReviewValue(data.supervisor_other_vehicle_count) },
      { label: 'Collision between DART vehicles', value: formatReviewValue(data.supervisor_collision_between_dart_vehicles) },
      { label: 'Other vehicles damaged', value: formatReviewValue(data.supervisor_other_vehicle_damage_count) },
      ...(showSupervisorOtherVehicleTowCount ? [{ label: 'Other vehicles towed', value: formatReviewValue(data.supervisor_other_vehicle_tow_count) }] : []),
    ] : []),
    { label: 'Scene diagram completed', value: formatReviewValue(data.supervisor_scene_diagram_completed) },
    { label: 'Scene photos taken', value: formatReviewValue(data.supervisor_scene_photos_taken) },
  ];
  const supervisorInjuryPoliceReviewFields = [
    { label: 'Employee fatalities', value: formatReviewValue(data.supervisor_dart_employee_fatalities) },
    ...(data.supervisor_dart_employee_fatalities ? [{ label: 'Employee fatality count', value: formatReviewValue(data.supervisor_dart_employee_fatality_count) }] : []),
    { label: 'Employee injuries', value: formatReviewValue(data.supervisor_dart_employee_injuries) },
    ...(data.supervisor_dart_employee_injuries ? [
      { label: 'Employees injured', value: formatReviewValue(data.supervisor_dart_employee_injury_count) },
      { label: 'Employees transported to hospital', value: formatReviewValue(data.supervisor_dart_employee_hospital_transport_count) },
    ] : []),
    { label: 'Passenger fatalities', value: formatReviewValue(data.supervisor_passenger_fatalities) },
    ...(data.supervisor_passenger_fatalities ? [{ label: 'Passenger fatality count', value: formatReviewValue(data.supervisor_passenger_fatality_count) }] : []),
    { label: 'Passenger injuries', value: formatReviewValue(data.supervisor_passenger_injuries) },
    ...(data.supervisor_passenger_injuries ? [{ label: 'Passenger injury count', value: formatReviewValue(data.supervisor_passenger_injury_count) }] : []),
    { label: 'Pedestrian fatalities', value: formatReviewValue(data.supervisor_pedestrian_fatalities) },
    ...(data.supervisor_pedestrian_fatalities ? [{ label: 'Pedestrian fatality count', value: formatReviewValue(data.supervisor_pedestrian_fatality_count) }] : []),
    { label: 'Pedestrian injuries', value: formatReviewValue(data.supervisor_pedestrian_injuries) },
    ...(data.supervisor_pedestrian_injuries ? [{ label: 'Pedestrian injury count', value: formatReviewValue(data.supervisor_pedestrian_injury_count) }] : []),
    ...(data.supervisor_other_vehicles_involved ? [{ label: 'Other vehicle occupant records', value: formatReviewValue(otherVehicleRecords.length) }] : []),
    { label: 'EMS at scene', value: formatReviewValue(data.ems_at_scene) },
    { label: 'Police called', value: formatReviewValue(data.supervisor_police_called) },
    ...(data.supervisor_police_called ? [
      { label: 'Officer at scene', value: formatReviewValue(data.supervisor_police_officer_name) },
      { label: 'Person who called police', value: formatReviewValue(data.supervisor_police_notified_by) },
      { label: 'Report city', value: formatReviewValue(data.supervisor_report_city) },
      { label: 'Police report number', value: formatReviewValue(data.supervisor_police_report_number) },
    ] : []),
  ];

  const handleConfirmationChange = (checked: boolean) => {
    if (isSupervisorReview) {
      onUpdate({ supervisor_confirmation_checked: checked });
      return;
    }

    if (isProgramManagerReview) {
      onUpdate({ program_manager_confirmation_checked: checked });
      return;
    }

    onUpdate({ confirmation_checked: checked });
  };

  const updateSupervisorCount = (field: keyof AccidentReportData, value: string, extraUpdates: Partial<AccidentReportData> = {}) => {
    onUpdate({ [field]: parseOptionalCount(value), ...extraUpdates } as Partial<AccidentReportData>);
  };

  // Supervisor bus vehicle cascade (bus → route → block), mirroring the operator's "The vehicle".
  const supervisorFleetOptions: ComboboxOption[] = FLEET.map((f) => ({ value: f.id, label: f.id, description: f.type }));
  const selectedSupervisorBus = FLEET.find((f) => f.id === data.supervisor_vehicle_number);
  const supervisorRouteOptions = Array.from(
    new Map((selectedSupervisorBus?.trips ?? []).map((t) => [t.route, { value: t.route, label: t.route }])).values()
  ).sort((a, b) => (parseInt(a.value.replace(/\D/g, ''), 10) || 0) - (parseInt(b.value.replace(/\D/g, ''), 10) || 0));
  const selectedSupervisorTrip = selectedSupervisorBus?.trips.find((t) => t.trip === data.supervisor_trip_id);
  const supervisorBlockOptions = (selectedSupervisorTrip?.blocks ?? []).map((b) => ({ value: b.block, label: b.block }));
  const supervisorHasVehicleRecord = !!(data.supervisor_vehicle_number && data.supervisor_trip_id?.trim() && data.supervisor_block_number?.trim());
  const updateSupervisorVehicleCascade = (val: string) => {
    const f = FLEET.find((x) => x.id === val);
    onUpdate({
      supervisor_vehicle_number: val,
      supervisor_fleet: f?.type,
      supervisor_trip_id: undefined, supervisor_operating_route_number: undefined, supervisor_end_of_line_destination: undefined,
      supervisor_block_number: undefined, supervisor_employee_pullout_date: undefined, supervisor_employee_pullout_time: undefined,
    });
  };
  const updateSupervisorRouteCascade = (val: string) => {
    const t = selectedSupervisorBus?.trips.find((x) => x.route === val);
    onUpdate({
      supervisor_operating_route_number: val,
      supervisor_trip_id: t?.trip,
      supervisor_end_of_line_destination: t?.endOfLine,
      supervisor_block_number: undefined, supervisor_employee_pullout_date: undefined, supervisor_employee_pullout_time: undefined,
    });
  };
  const updateSupervisorBlockCascade = (val: string) => {
    const b = selectedSupervisorTrip?.blocks.find((x) => x.block === val);
    onUpdate({ supervisor_block_number: val, supervisor_employee_pullout_date: b?.pulloutDate, supervisor_employee_pullout_time: b?.pulloutTime });
  };

  const updateSupervisorBusVehicleNumber = (value: string) => {
    const vehicle = BUS_VEHICLE_DB.find(item => item.id === value);
    onUpdate(vehicle
      ? { supervisor_vehicle_number: vehicle.id, supervisor_fleet: vehicle.type, supervisor_trip_id: vehicle.tripId }
      : { supervisor_vehicle_number: value, supervisor_fleet: undefined, supervisor_trip_id: undefined });
  };

  const updateSupervisorRailVehicleNumber = (value: string) => {
    const record = RAIL_FLEET_DB.find(item => item.trainNumber === value);
    onUpdate(record
      ? {
          supervisor_vehicle_number: record.trainNumber,
          supervisor_lrv_fleet_type: record.fleetType,
          supervisor_fleet: record.fleetType,
          supervisor_car_number: record.carNumber,
        }
      : {
          supervisor_vehicle_number: value,
          supervisor_lrv_fleet_type: undefined,
          supervisor_fleet: undefined,
          supervisor_car_number: undefined,
        });
  };

  const updateSupervisorRevenueService = (value: boolean) => {
    onUpdate({
      supervisor_revenue_service: value,
      ...(!value ? {
        supervisor_operating_route_number: undefined,
        supervisor_block_number: undefined,
        supervisor_rail_line: undefined,
      } : {}),
    });
  };

  const updateSupervisorDemographicRecord = (
    field: 'supervisor_passenger_fatality_details' | 'supervisor_passenger_injury_details' | 'supervisor_pedestrian_fatality_details' | 'supervisor_pedestrian_injury_details',
    records: SupervisorDemographicRecord[],
    index: number,
    patch: Partial<SupervisorDemographicRecord>
  ) => {
    const nextRecords = records.map((record, recordIndex) => recordIndex === index ? { ...record, ...patch } : record);
    onUpdate({ [field]: nextRecords } as Partial<AccidentReportData>);
  };

  const updateSupervisorOtherVehicleRecord = (index: number, patch: Partial<SupervisorOtherVehicleRecord>) => {
    const nextRecords = otherVehicleRecords.map((record, recordIndex) => recordIndex === index ? { ...record, ...patch } : record);
    onUpdate({ supervisor_other_vehicle_records: nextRecords });
  };

  useEffect(() => {
    if (!isSupervisorReview || !supervisorWorkdayRecord) {
      return;
    }

    const nextIdentity: Partial<AccidentReportData> = {};
    if (data.supervisor_badge_number !== supervisorWorkdayRecord.badge) {
      nextIdentity.supervisor_badge_number = supervisorWorkdayRecord.badge;
    }
    if (data.supervisor_name !== supervisorWorkdayRecord.name) {
      nextIdentity.supervisor_name = supervisorWorkdayRecord.name;
    }
    const [derivedFirst, ...restName] = supervisorWorkdayRecord.name.trim().split(/\s+/);
    const derivedLast = restName.join(' ');
    if (derivedFirst && data.supervisor_first_name !== derivedFirst) {
      nextIdentity.supervisor_first_name = derivedFirst;
    }
    if (derivedLast && data.supervisor_last_name !== derivedLast) {
      nextIdentity.supervisor_last_name = derivedLast;
    }
    if (data.supervisor_division !== supervisorWorkdayRecord.division) {
      nextIdentity.supervisor_division = supervisorWorkdayRecord.division;
    }

    if (Object.keys(nextIdentity).length > 0) {
      onUpdate(nextIdentity);
    }
  }, [data.supervisor_badge_number, data.supervisor_division, data.supervisor_name, data.supervisor_first_name, data.supervisor_last_name, isSupervisorReview, onUpdate, supervisorWorkdayRecord]);

  const programManagerWorkdayRecord = roleConfig.role === 'Program Manager' ? EMPLOYEE_DB[roleConfig.badge] : undefined;

  useEffect(() => {
    if (!isProgramManagerReview || !programManagerWorkdayRecord) {
      return;
    }

    const nextIdentity: Partial<AccidentReportData> = {};
    if (data.program_manager_badge_number !== programManagerWorkdayRecord.badge) {
      nextIdentity.program_manager_badge_number = programManagerWorkdayRecord.badge;
    }
    const [pmFirst, ...pmRest] = programManagerWorkdayRecord.name.trim().split(/\s+/);
    const pmLast = pmRest.join(' ');
    if (pmFirst && data.program_manager_first_name !== pmFirst) {
      nextIdentity.program_manager_first_name = pmFirst;
    }
    if (pmLast && data.program_manager_last_name !== pmLast) {
      nextIdentity.program_manager_last_name = pmLast;
    }
    if (programManagerWorkdayRecord.department && data.program_manager_department !== programManagerWorkdayRecord.department) {
      nextIdentity.program_manager_department = programManagerWorkdayRecord.department;
    }
    if (data.program_manager_classified_by_name !== programManagerWorkdayRecord.name) {
      nextIdentity.program_manager_classified_by_name = programManagerWorkdayRecord.name;
    }
    if (data.program_manager_classified_by_badge !== programManagerWorkdayRecord.badge) {
      nextIdentity.program_manager_classified_by_badge = programManagerWorkdayRecord.badge;
    }

    if (Object.keys(nextIdentity).length > 0) {
      onUpdate(nextIdentity);
    }
  }, [data.program_manager_badge_number, data.program_manager_first_name, data.program_manager_last_name, data.program_manager_department, data.program_manager_classified_by_name, data.program_manager_classified_by_badge, isProgramManagerReview, onUpdate, programManagerWorkdayRecord]);

  const renderDemographicRecords = (
    records: SupervisorDemographicRecord[],
    field: 'supervisor_passenger_fatality_details' | 'supervisor_passenger_injury_details' | 'supervisor_pedestrian_fatality_details' | 'supervisor_pedestrian_injury_details',
    title: string,
    includeTransported: boolean
  ) => (
    <div className="space-y-3 md:col-span-2">
      {records.map((record, index) => (
        <div key={`${field}-${index}`} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
          <div className="md:col-span-3 text-xs font-semibold text-slate-700 font-['Poppins']">{title} #{index + 1}</div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Age</div>
            <CustomSelect value={record.age_group || ''} onChange={(v) => updateSupervisorDemographicRecord(field, records, index, { age_group: v as SupervisorDemographicRecord['age_group'] })} options={AGE_GROUP_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select age" />
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Gender</div>
            <CustomSelect value={record.gender || ''} onChange={(v) => updateSupervisorDemographicRecord(field, records, index, { gender: v as SupervisorDemographicRecord['gender'] })} options={GENDER_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select gender" />
          </div>
          {includeTransported && (
            <div>
              <div className={FIELD_LABEL_CLASS}>Transported to hospital</div>
              <YesNoButtons value={record.transported_to_hospital} onChange={(value) => updateSupervisorDemographicRecord(field, records, index, { transported_to_hospital: value })} />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderOtherVehicleRecord = (record: SupervisorOtherVehicleRecord, index: number) => {
    const vehicleNumber = index + 2;
    const deceasedOccupants = resizeDemographicRecords(record.deceased_occupants, record.occupant_fatality_count);
    const injuredOccupants = resizeDemographicRecords(record.injured_occupants, record.occupant_injury_count);

    const updateNestedDemographicRecord = (
      key: 'deceased_occupants' | 'injured_occupants',
      records: SupervisorDemographicRecord[],
      nestedIndex: number,
      patch: Partial<SupervisorDemographicRecord>
    ) => {
      updateSupervisorOtherVehicleRecord(index, {
        [key]: records.map((nestedRecord, recordIndex) => recordIndex === nestedIndex ? { ...nestedRecord, ...patch } : nestedRecord),
      });
    };

    return (
      <div key={record.id || `other-vehicle-${vehicleNumber}`} className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h6 className="text-sm font-semibold text-slate-900 font-['Poppins']">Other vehicle #{vehicleNumber}</h6>
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          <div>
            <div className={FIELD_LABEL_CLASS}>Number of occupant fatalities in other vehicle #{vehicleNumber}</div>
            <input
              type="number"
              min={0}
              value={record.occupant_fatality_count ?? ''}
              onChange={(e) => {
                const count = parseOptionalCount(e.target.value);
                updateSupervisorOtherVehicleRecord(index, {
                  occupant_fatality_count: count,
                  deceased_occupants: resizeDemographicRecords(record.deceased_occupants, count),
                });
              }}
              className={COMPACT_INPUT_CLASS}
            />
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Were there injuries to occupants in other vehicle #{vehicleNumber}?</div>
            <YesNoButtons value={record.occupant_injuries} onChange={(value) => updateSupervisorOtherVehicleRecord(index, {
              occupant_injuries: value,
              ...(!value ? { occupant_injury_count: undefined, injured_occupants: [] } : {}),
            })} />
          </div>
        </div>

        {deceasedOccupants.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {deceasedOccupants.map((occupant, occupantIndex) => (
              <div key={`deceased-${vehicleNumber}-${occupantIndex}`} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
                <div className="md:col-span-2 text-xs font-semibold text-slate-700 font-['Poppins']">Deceased occupant #{occupantIndex + 1}</div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Age</div>
                  <CustomSelect value={occupant.age_group || ''} onChange={(v) => updateNestedDemographicRecord('deceased_occupants', deceasedOccupants, occupantIndex, { age_group: v as SupervisorDemographicRecord['age_group'] })} options={AGE_GROUP_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select age" />
                </div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Gender</div>
                  <CustomSelect value={occupant.gender || ''} onChange={(v) => updateNestedDemographicRecord('deceased_occupants', deceasedOccupants, occupantIndex, { gender: v as SupervisorDemographicRecord['gender'] })} options={GENDER_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select gender" />
                </div>
              </div>
            ))}
          </div>
        )}

        {record.occupant_injuries && (
          <div className="space-y-4">
            <div>
              <div className={FIELD_LABEL_CLASS}>Number of occupants in other vehicle #{vehicleNumber} injured</div>
              <input
                type="number"
                min={1}
                value={record.occupant_injury_count ?? ''}
                onChange={(e) => {
                  const count = parseOptionalCount(e.target.value);
                  updateSupervisorOtherVehicleRecord(index, {
                    occupant_injury_count: count,
                    injured_occupants: resizeDemographicRecords(record.injured_occupants, count),
                  });
                }}
                className={COMPACT_INPUT_CLASS}
              />
            </div>
            {injuredOccupants.length > 0 && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {injuredOccupants.map((occupant, occupantIndex) => (
                  <div key={`injured-${vehicleNumber}-${occupantIndex}`} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
                    <div className="md:col-span-3 text-xs font-semibold text-slate-700 font-['Poppins']">Injured occupant #{occupantIndex + 1}</div>
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Age</div>
                      <CustomSelect value={occupant.age_group || ''} onChange={(v) => updateNestedDemographicRecord('injured_occupants', injuredOccupants, occupantIndex, { age_group: v as SupervisorDemographicRecord['age_group'] })} options={AGE_GROUP_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select age" />
                    </div>
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Gender</div>
                      <CustomSelect value={occupant.gender || ''} onChange={(v) => updateNestedDemographicRecord('injured_occupants', injuredOccupants, occupantIndex, { gender: v as SupervisorDemographicRecord['gender'] })} options={GENDER_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select gender" />
                    </div>
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Transported to hospital</div>
                      <YesNoButtons value={occupant.transported_to_hospital} onChange={(value) => updateNestedDemographicRecord('injured_occupants', injuredOccupants, occupantIndex, { transported_to_hospital: value })} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          <div>
            <div className={FIELD_LABEL_CLASS}>Other vehicle #{vehicleNumber} type</div>
            <CustomSelect value={record.type || ''} onChange={(v) => updateSupervisorOtherVehicleRecord(index, { type: v })} options={otherVehicleTypeOptions.map((option) => ({ value: option, label: option }))} placeholder="Select type" />
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Other vehicle #{vehicleNumber} action</div>
            <CustomSelect value={record.action || ''} onChange={(v) => updateSupervisorOtherVehicleRecord(index, { action: v })} options={OTHER_VEHICLE_ACTION_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select action" />
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Other vehicle #{vehicleNumber} point of impact</div>
            <CustomSelect value={record.point_of_impact || ''} onChange={(v) => updateSupervisorOtherVehicleRecord(index, { point_of_impact: v })} options={OTHER_VEHICLE_POINT_OF_IMPACT_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select point of impact" />
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Direction of other vehicle #{vehicleNumber} in relation to DART vehicle</div>
            <CustomSelect value={record.direction || ''} onChange={(v) => updateSupervisorOtherVehicleRecord(index, { direction: v })} options={OTHER_VEHICLE_DIRECTION_OPTIONS.map((option) => ({ value: option, label: option }))} placeholder="Select direction" />
          </div>
        </div>
      </div>
    );
  };

  const renderSupervisorReviewGroup = (
    title: string,
    description: string,
    editStep: number,
    fields: Array<{ label: string; value: string; required?: boolean; wide?: boolean }>
  ) => (
    <div className="rounded-xl border border-slate-200/70 bg-white overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h5 className="text-sm font-semibold text-[#00205B] font-['Poppins']">{title}</h5>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setSupervisorReviewStep(editStep)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#007DBA] transition-colors hover:bg-[#007DBA]/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const isEmpty = field.value === 'Not entered';
          const displayValue = isEmpty ? '—' : field.value;
          return (
            <div key={`${title}-${field.label}`} className={field.wide ? 'sm:col-span-2 xl:col-span-3' : ''}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">
                {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
              </dt>
              <dd className={`mt-1 text-sm leading-relaxed font-['Poppins'] ${isEmpty ? 'italic text-slate-400' : 'font-semibold text-slate-900'}`}>{displayValue}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );

  // Same shape, driven by setPmReviewStep for the SPM's Review recap groups.
  const renderPmReviewGroup = (
    title: string,
    description: string,
    editStep: number,
    fields: Array<{ label: string; value: string; required?: boolean; wide?: boolean }>
  ) => (
    <div className="rounded-xl border border-slate-200/70 bg-white overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h5 className="text-sm font-semibold text-[#00205B] font-['Poppins']">{title}</h5>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setPmReviewStep(editStep)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#007DBA] transition-colors hover:bg-[#007DBA]/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const isEmpty = field.value === 'Not entered';
          const displayValue = isEmpty ? '—' : field.value;
          return (
            <div key={`${title}-${field.label}`} className={field.wide ? 'sm:col-span-2 xl:col-span-3' : ''}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">
                {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
              </dt>
              <dd className={`mt-1 text-sm leading-relaxed font-['Poppins'] ${isEmpty ? 'italic text-slate-400' : 'font-semibold text-slate-900'}`}>{displayValue}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );

  const handleRunSmartCheck = () => {
    const issues: Array<{ id: string; message: string; section?: string }> = isSupervisorReview
      ? supervisorRequiredReviewItems.map((item) => ({
          id: item.id,
          message: `Complete ${item.label.toLowerCase()} before submitting the Field Supervisor section.`,
          section: `Step ${item.step}`,
        }))
      : [];

    const reviewIncidentTime = isSupervisorReview ? data.supervisor_incident_time : data.incident_time;

    // Example smart checks - cross-field validation
    if (reviewIncidentTime && parseInt(reviewIncidentTime.split(':')[0]) < 4) {
      issues.push({ 
        id: '1',
        message: 'Incident time is earlier than the usual service hours for this route. Check the time.'
      });
    }

    // Check if description mentions things not captured in structured fields
    if (data.incident_description?.toLowerCase().includes('pedestrian') && !data.people?.some(p => p.role === 'Pedestrian')) {
      issues.push({ 
        id: '2',
        message: 'Description mentions a pedestrian but the pedestrian section is empty.'
      });
    }

    if (issues.length > 0) {
      setSmartCheckIssues(issues);
      setSmartCheckState('issues');
    } else {
      setSmartCheckState('clear');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    onUpdate({ attachments: [...attachments, ...files] });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onUpdate({ attachments: [...attachments, ...files] });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onUpdate({ attachments: updated });
  };

  const handleDownloadAttachment = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  const canSubmit = Boolean(
    isRoleAllowedToAdvance &&
    confirmationChecked &&
    data.mode &&
    data.event_type &&
    data.employee_badge_number &&
    data.employee_name &&
    data.incident_date &&
    data.incident_time &&
    (data.description_of_event || data.incident_description)
  );

  const reviewCanSubmit = Boolean(
    isRoleAllowedToAdvance &&
    (isProgramManagerReview || confirmationChecked) &&
    (!isSupervisorReview || (
      supervisorRequiredReviewItems.length === 0
    )) &&
    (!isProgramManagerReview || (
      data.operator_datetime_correct !== undefined &&
      data.supervisor_event_description &&
      data.program_manager_classification_value &&
      data.program_manager_classification_date &&
      data.program_manager_classification_justification
    ))
  );

  // Compute exactly which PM fields are missing so we can point the reviewer to the right step
  const pmMissingFields: Array<{ label: string; step: number; stepName: string }> = [];
  if (isProgramManagerReview) {
    if (data.operator_datetime_correct === undefined) pmMissingFields.push({ label: 'Confirm operator date/time is correct', step: 1, stepName: 'Investigation Basics' });
    if (!data.supervisor_event_description) pmMissingFields.push({ label: 'Field supervisor statement (missing from Field Supervisor)', step: 1, stepName: 'Investigation Basics' });
    if (!data.program_manager_classification_value) pmMissingFields.push({ label: 'Classification value', step: 4, stepName: 'Classify' });
    if (!data.program_manager_classification_date) pmMissingFields.push({ label: 'Date classified', step: 4, stepName: 'Classify' });
    if (!data.program_manager_classification_justification) pmMissingFields.push({ label: 'Justification of classification', step: 4, stepName: 'Classify' });
  }

  const submitDisabled = isSectionAlreadySubmitted || (isSupervisorReview || isProgramManagerReview ? !reviewCanSubmit : !canSubmit);
  const stepDescription = description || (isSupervisorReview ? 'Confirm your entries and submit for program manager review.' : 'Check your section details, then attach any photos or documents.');
  // Once the operator confirms accuracy and enters the actions surface, the step
  // header should read as "Choose next action" instead of still saying Review.
  const effectiveTitle = isOperatorFinalReview && operatorInActionsMode ? 'Choose next action' : title;
  const effectiveDescription = isOperatorFinalReview && operatorInActionsMode
    ? 'Select what should happen next. Your choice will update the workflow status and assignment.'
    : stepDescription;
  const effectiveShowStepBadge = isOperatorFinalReview && operatorInActionsMode ? false : showStepBadge;

  useEffect(() => {
    if (!isSupervisorReview && supervisorReviewStep !== 1) {
      setSupervisorReviewStep(1);
    }
  }, [isSupervisorReview, supervisorReviewStep]);

  useEffect(() => {
    onProgramManagerActionsModeChange?.(pmInActionsMode);
  }, [pmInActionsMode, onProgramManagerActionsModeChange]);

  useEffect(() => {
    onOperatorActionsModeChange?.(operatorInActionsMode);
  }, [operatorInActionsMode, onOperatorActionsModeChange]);

  useEffect(() => {
    onSupervisorActionsModeChange?.(fsInActionsMode);
  }, [fsInActionsMode, onSupervisorActionsModeChange]);

  // Shared attachments block, rendered inline within each role's form flow (not as a
  // detached trailing card). Text adapts to the active role.
  const roleAttachmentsSection = (
    <div className="dart-card dart-card--surface overflow-hidden">
      <div className="dart-card-header">
        <h4 className="dart-h4">Support documents</h4>
        <p className="dart-caption mt-1">
          {isSupervisorReview
            ? 'Upload completed supervisor support documents, diagrams, and evidence files for this case.'
            : 'Upload classification notes, statements, or supporting documents for this case.'}
        </p>
      </div>
      <div className="p-6">
        {isSupervisorReview && (
          <div className="mb-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Supervisor templates</p>
            <p className="mt-1 text-xs text-slate-700 font-['Poppins']">Download, complete, then upload these forms as part of your supervisor submission.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUPERVISOR_TEMPLATE_DOWNLOADS.map((template) => (
                <a
                  key={template.href}
                  href={template.href}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                >
                  <Download className="h-3.5 w-3.5" />
                  {template.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${isDragging
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }
          `}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
          <div className="text-sm text-slate-700 mb-1 font-['Poppins']">
            Drag and drop files here, or select files to upload
          </div>
          <div className="text-xs text-slate-500 mb-4 font-['Poppins']">
            Supports images, PDFs, and documents
          </div>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="role-file-upload"
          />
          <button
            type="button"
            onClick={() => document.getElementById('role-file-upload')?.click()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
          >
            Select files
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-slate-100 p-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-900 font-['Poppins']">{file.name}</div>
                    <div className="text-xs text-slate-500 font-['Poppins']">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadAttachment(file)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                    aria-label={`Download ${file.name}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                    aria-label="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Supervisor-only: templates + scene questions + upload, grouped together where
  // the mental model belongs (during investigation, not on final review).
  const sceneDocumentationSection = (
    <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Scene documentation</h3>
      <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Download the diagram templates, fill them in on Word, then upload the completed files here along with any scene photos.</p>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Templates</p>
        <p className="mt-1 text-xs text-slate-700 font-['Poppins']">Download, complete in Word, then upload the finished files below.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPERVISOR_TEMPLATE_DOWNLOADS.map((template) => (
            <a
              key={template.href}
              href={template.href}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
            >
              <Download className="h-3.5 w-3.5" />
              {template.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Scene diagram completed?</div>
          <div className="shrink-0"><YesNoButtons value={data.supervisor_scene_diagram_completed} onChange={(value) => onUpdate({ supervisor_scene_diagram_completed: value })} /></div>
        </div>
        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Scene photos taken?</div>
          <div className="shrink-0"><YesNoButtons value={data.supervisor_scene_photos_taken} onChange={(value) => onUpdate({ supervisor_scene_photos_taken: value })} /></div>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
        <div className="text-sm text-slate-700 mb-1 font-['Poppins']">Drag and drop files here, or select files to upload</div>
        <div className="text-xs text-slate-500 mb-4 font-['Poppins']">Supports images, PDFs, and Word documents</div>
        <input type="file" multiple onChange={handleFileSelect} className="hidden" id="supervisor-scene-file-upload" />
        <button
          type="button"
          onClick={() => document.getElementById('supervisor-scene-file-upload')?.click()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
        >
          Select files
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="rounded bg-slate-100 p-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-900 font-['Poppins']">{file.name}</div>
                  <div className="text-xs text-slate-500 font-['Poppins']">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAttachment(file)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  aria-label="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Read-only recap of what will be submitted, shown on supervisor final review.
  const supervisorUploadsRecap = (
    <div className="dart-card dart-card--surface overflow-hidden">
      <div className="dart-card-header">
        <h4 className="dart-h4">Scene documents to submit</h4>
        <p className="dart-caption mt-1">
          {attachments.length > 0
            ? 'Files that will be submitted with this case. Manage these in Scene documentation.'
            : 'No documents uploaded yet. Add them in Scene documentation before submitting.'}
        </p>
      </div>
      {attachments.length > 0 && (
        <div className="p-6 space-y-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="rounded bg-slate-100 p-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-900 font-['Poppins']">{file.name}</div>
                  <div className="text-xs text-slate-500 font-['Poppins']">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <StepContainer
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title={effectiveTitle}
      description={effectiveDescription}
      showStepBadge={effectiveShowStepBadge}
    >
      <div className="space-y-7">
        {!isRoleAllowedToAdvance && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900 font-['Poppins']">
              This case is currently in the {stageName.toLowerCase()} stage.
            </p>
            <p className="mt-1 text-xs text-amber-800 font-['Poppins']">
              Switch the preview role in the header to continue the workflow.
            </p>
          </div>
        )}

        {isInitiationStage && (
          <div className="rounded-xl border border-[#0078AE]/30 bg-[#0078AE]/10 p-4">
            <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">Starter scenario review</p>
            <p className="mt-1 text-xs text-[#0A4F75] font-['Poppins']">
              {initiatedBy} is checking only the intake fields captured to open the case. The operator completes their section after this handoff.
            </p>
          </div>
        )}

        {handoffNote && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900 font-['Poppins']">Clarification requested</p>
            <p className="mt-1 text-xs text-amber-800 font-['Poppins']">{handoffNote}</p>
          </div>
        )}

        {/* Incident Basics Summary */}
        {showInlineReferenceSummaries && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">Incident basics</h4>
            <button
              onClick={() => onJumpToStep(1)}
              className="dart-action-link flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Mode</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.mode || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Event type</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.event_type || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Service status</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.service_status_at_time || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Incident date & time</div>
              <div className="text-sm text-slate-900 font-['Poppins']">
                {data.incident_date && data.incident_time 
                  ? `${data.incident_date} at ${data.incident_time}`
                  : '—'
                }
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Incident Details Summary */}
        {showInlineReferenceSummaries && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">Incident details</h4>
            <button
              onClick={() => onJumpToStep(2)}
              className="dart-action-link flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Vehicle number</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.vehicle_number || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Fleet type</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.fleet_type || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Assigned route</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.assigned_route || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Operating route</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.operating_route || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Location type</div>
              <div className="text-sm text-slate-900 font-['Poppins']">{data.location_type || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">City / County</div>
              <div className="text-sm text-slate-900 font-['Poppins']">
                {data.city || data.county 
                  ? `${data.city || ''}${data.city && data.county ? ', ' : ''}${data.county || ''}`
                  : '—'
                }
              </div>
            </div>
          </div>
        </div>
        )}

        {/* People and Impact Summary */}
        {showInlineReferenceSummaries && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">People and impact</h4>
            <button
              onClick={() => onJumpToStep(3)}
              className="dart-action-link flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Anyone involved?</div>
              <div className="text-sm text-slate-900 font-['Poppins']">
                {data.people_involved === true ? 'Yes' : data.people_involved === false ? 'No' : '—'}
              </div>
            </div>
            {data.people_involved && data.people && data.people.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2 font-['Poppins']">People involved ({data.people.length})</div>
                <div className="space-y-2">
                  {data.people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm text-slate-900 font-['Poppins']">{person.name || person.role}</div>
                        <div className="text-xs text-slate-600 font-['Poppins']">{person.role}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`
                          inline-flex px-2 py-1 rounded-full text-xs font-['Poppins']
                          ${person.fatal ? 'bg-red-100 text-red-700' : person.injured ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                        `}>
                          {person.fatal ? 'Fatal' : person.injured ? 'Injured' : 'No injury'}
                        </span>
                        {person.transported_to_hospital === true && (
                          <span className="text-xs text-slate-600 font-['Poppins']">Transported</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Attachments */}
        {showInlineReferenceSummaries && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">Attachments</h4>
            <p className="text-xs text-slate-600 mt-1 font-['Poppins']">
              {isSupervisorReview
                ? 'Upload completed supervisor support documents, diagrams, and evidence files for this case.'
                : 'Add photos, documents, or supporting reports related to this incident'}
            </p>
          </div>
          <div className="p-6">
            {isSupervisorReview && (
              <div className="mb-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Supervisor templates</p>
                <p className="mt-1 text-xs text-slate-700 font-['Poppins']">Download, complete, then upload these forms as part of your supervisor submission.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUPERVISOR_TEMPLATE_DOWNLOADS.map((template) => (
                    <a
                      key={template.href}
                      href={template.href}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {template.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all
                ${isDragging 
                  ? 'border-emerald-400 bg-emerald-50' 
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }
              `}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-sm text-slate-700 mb-1 font-['Poppins']">
                Drag and drop files here, or select files to upload
              </div>
              <div className="text-xs text-slate-500 mb-4 font-['Poppins']">
                Supports images, PDFs, and documents
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <span className="inline-block cursor-pointer">
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                  >
                    Select files
                  </button>
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-slate-100 p-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-900 font-['Poppins']">{file.name}</div>
                        <div className="text-xs text-slate-500 font-['Poppins']">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadAttachment(file)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                        aria-label={`Download ${file.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                        aria-label="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Operator "choose next action" screen — mirrors the Field Supervisor and PM pattern.
            Replaces the review summaries + confirmation footer once the operator has confirmed
            their section is accurate. */}
        {isOperatorFinalReview && operatorInActionsMode && (
          operatorConfirmedAction ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white p-6 md:p-8 shadow-[0_2px_12px_-2px_rgba(16,185,129,0.10)] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35)]">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-[#00205B] font-['Poppins']">{operatorConfirmedAction.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700 font-['Poppins']">{operatorConfirmedAction.description}</p>
                  {submittedEventId && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-white/80 px-3 py-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-900 font-['Poppins']">Case ID {submittedEventId}</span>
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {onBackToHome && (
                      <GlassButton variant="primary" onClick={onBackToHome}>Back to home</GlassButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ActionSelectionScreen
              title="Choose next action"
              description="Select what should happen next. Your choice will update the workflow status and assignment."
              actions={buildOperatorActions({ initiatedByOperator: initiatedBy === 'Operator' })}
              onConfirm={(actionId) => {
                // TODO: swap for workflow engine call when the API contract lands.
                if (actionId === 'send-to-supervisor') {
                  onSubmit();
                  setOperatorConfirmedAction({
                    actionId,
                    title: 'Sent to Field Supervisor',
                    description: initiatedBy === 'Operator'
                      ? 'The report is now in the Operator Initiated queue and assigned to your Field Supervisor for review.'
                      : 'Your section has been returned to the Field Supervisor. They will finish their review and route the case forward.',
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          )
        )}

        {isSupervisorReview && (
          <div className="space-y-6">
            {operatorReportAvailable && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOperatorReportOpen(true)}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                >
                  Open operator report
                </button>
              </div>
            )}

            <div className="space-y-6">
              {supervisorReviewStep === 1 && (
              <div className="dart-card dart-card--surface overflow-hidden">
              {supervisorSubStep1MissingItems.length > 0 && (
                <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 md:mx-7">
                  <p className="text-sm font-semibold text-red-900 font-['Poppins']">
                    {supervisorSubStep1MissingItems.length === 1
                      ? 'One required field is missing'
                      : `${supervisorSubStep1MissingItems.length} required fields are missing`}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-red-800 font-['Poppins']">
                    {supervisorSubStep1MissingItems.map((item) => (
                      <li key={item.id}>• {item.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Field Supervisor arrival</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">When you reached the scene, and your account of what happened.</p>
                <div>
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <label className="dart-field-label sm:mb-0 min-w-0">
                      Did you go to the scene? <span className="dart-req ml-1">*</span>
                    </label>
                    <div className="shrink-0">
                      <YesNoButtons
                        value={data.supervisor_went_to_scene}
                        onChange={(v) => onUpdate(v
                          ? { supervisor_went_to_scene: true, supervisor_no_scene_reason: undefined }
                          : { supervisor_went_to_scene: false, supervisor_arrival_date: undefined, supervisor_arrival_time: undefined })}
                      />
                    </div>
                  </div>
                  {supervisorWentToSceneError && (
                    <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">Did you go to the scene? is required.</p>
                  )}
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-7">
                  <AnimatePresence initial={false} mode="wait">
                    {data.supervisor_went_to_scene === true && (
                      <motion.div {...REVEAL_MOTION} key="supervisor-arrival-yes" className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <FormField label="Field Supervisor arrival date" required error={supervisorArrivalDateError}>
                          <DatePickerInput value={data.supervisor_arrival_date || ''} onChange={(value) => onUpdate({ supervisor_arrival_date: value })} />
                        </FormField>
                        <FormField label="Field Supervisor arrival time" required error={supervisorArrivalTimeError}>
                          <TimePickerInput value={data.supervisor_arrival_time || ''} onChange={(value) => onUpdate({ supervisor_arrival_time: value })} />
                        </FormField>
                      </motion.div>
                    )}
                    {data.supervisor_went_to_scene === false && (
                      <motion.div {...REVEAL_MOTION} key="supervisor-arrival-no">
                        <FormField label="Why didn't you go to the scene?" required error={supervisorNoSceneReasonError}>
                          <textarea rows={3} value={data.supervisor_no_scene_reason || ''} onChange={(e) => onUpdate({ supervisor_no_scene_reason: e.target.value })} placeholder="Explain why you did not respond to the scene." className={TEXTAREA_CLASS} />
                        </FormField>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <FormField label="Field Supervisor description of safety event" required error={supervisorEventDescriptionError}>
                    <textarea rows={4} value={data.supervisor_event_description || ''} onChange={(e) => onUpdate({ supervisor_event_description: e.target.value })} placeholder="Add supervisor investigation notes" className={TEXTAREA_CLASS} />
                  </FormField>
                </div>
              </div>

              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Vehicle details</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">{supervisorVehicleType ? `Vehicle mode set at intake: ${supervisorVehicleType}. Confirm the vehicle details below.` : 'Confirm the DART vehicle details for this event.'}</p>
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                  <AnimatePresence initial={false} mode="wait">
                    {hasSupervisorVehicleType && (
                      <motion.div {...REVEAL_MOTION} key={`supervisor-vehicle-${supervisorVehicleType}`} className="md:col-span-2">
                        {supervisorVehicleType === 'Bus' ? (
                          <div className="space-y-4">
                            <AnimatePresence>
                              {supervisorHasVehicleRecord && (
                                <motion.div {...REVEAL_MOTION} key="supervisor-vehicle-record">
                                  <SupervisorVehicleRecordCard data={data} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Bus vehicle number <span className="text-red-500">*</span></div>
                                <SearchableCombobox
                                  options={supervisorFleetOptions}
                                  value={data.supervisor_vehicle_number || ''}
                                  onChange={updateSupervisorVehicleCascade}
                                  placeholder="Search vehicle #"
                                  searchPlaceholder="Type vehicle number..."
                                  emptyMessage="No vehicles found"
                                />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Route <span className="text-red-500">*</span></div>
                                <CustomSelect value={data.supervisor_operating_route_number || ''} onChange={updateSupervisorRouteCascade} options={supervisorRouteOptions} placeholder={data.supervisor_vehicle_number ? 'Select route' : 'Select bus first'} disabled={!data.supervisor_vehicle_number} />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Block ID <span className="text-red-500">*</span></div>
                                <CustomSelect value={data.supervisor_block_number || ''} onChange={updateSupervisorBlockCascade} options={supervisorBlockOptions} placeholder={data.supervisor_operating_route_number ? 'Select block' : 'Select route first'} disabled={!data.supervisor_operating_route_number} />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Status before event</div>
                                <CustomSelect value={data.supervisor_bus_status_before || ''} onChange={(v) => onUpdate({ supervisor_bus_status_before: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Status after event</div>
                                <CustomSelect value={data.supervisor_bus_status_after || ''} onChange={(v) => onUpdate({ supervisor_bus_status_after: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
                              </div>
                            </div>
                          </div>
                        ) : supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar' ? (
                          <div className="space-y-4">
                            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${supervisorVehicleType === 'Streetcar' ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>{supervisorVehicleType === 'Streetcar' ? 'Streetcar number' : 'LRV number involved in event'} <span className="text-red-500">*</span></div>
                                <SearchableCombobox
                                  options={supervisorRailFleetOptions}
                                  value={data.supervisor_vehicle_number || ''}
                                  onChange={updateSupervisorRailVehicleNumber}
                                  placeholder={supervisorVehicleType === 'Streetcar' ? 'Search streetcar #' : 'Search LRV #'}
                                  searchPlaceholder={supervisorVehicleType === 'Streetcar' ? 'Type streetcar number...' : 'Type LRV number...'}
                                  emptyMessage="No linked fleet records found"
                                />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>{supervisorVehicleType === 'Streetcar' ? 'Streetcar fleet type' : 'LRV fleet type'}</div>
                                <input
                                  type="text"
                                  readOnly
                                  value={data.supervisor_lrv_fleet_type || ''}
                                  placeholder={data.supervisor_vehicle_number ? '—' : 'Auto-filled from LRV #'}
                                  className={`${INPUT_CLASS} bg-white/70 cursor-not-allowed text-slate-500`}
                                />
                              </div>
                              {supervisorVehicleType === 'Streetcar' && (
                                <div>
                                  <div className={FIELD_LABEL_CLASS}>Car number involved in event</div>
                                  <input
                                    type="text"
                                    readOnly
                                    value={data.supervisor_car_number || ''}
                                    placeholder={data.supervisor_vehicle_number ? '—' : 'Auto-filled from streetcar #'}
                                    className={`${INPUT_CLASS} bg-white/70 cursor-not-allowed text-slate-500`}
                                  />
                                </div>
                              )}
                              <div>
                                <div className={FIELD_LABEL_CLASS}>LRV pull-out date</div>
                                <DatePickerInput value={data.supervisor_train_pullout_date || ''} onChange={(value) => onUpdate({ supervisor_train_pullout_date: value })} />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>LRV pull-out time</div>
                                <TimePickerInput value={data.supervisor_train_pullout_time || ''} onChange={(value) => onUpdate({ supervisor_train_pullout_time: value })} />
                              </div>
                            </div>
                            {supervisorVehicleType === 'Light Rail Vehicle' && (
                              <LrvConsistFields
                                data={data}
                                onUpdate={onUpdate}
                                countKey="supervisor_lrv_consist_count"
                                additionalKeys={['supervisor_lrv_consist_2', 'supervisor_lrv_consist_3', 'supervisor_lrv_consist_4']}
                                leadNumber={data.supervisor_vehicle_number}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <div className={FIELD_LABEL_CLASS}>Vehicle number</div>
                              <input type="text" value={data.supervisor_vehicle_number || ''} onChange={(e) => onUpdate({ supervisor_vehicle_number: e.target.value })} className={INPUT_CLASS} />
                            </div>
                            <div>
                              <div className={FIELD_LABEL_CLASS}>Fleet or asset type</div>
                              <input type="text" value={data.supervisor_fleet || ''} onChange={(e) => onUpdate({ supervisor_fleet: e.target.value })} className={INPUT_CLASS} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {showSupervisorRevenueQuestion && (
                    <div className="md:col-span-2">
                      <DecisionGroup label="Was DART vehicle in revenue service at time of the event?" value={data.supervisor_revenue_service} onChange={updateSupervisorRevenueService}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <div className={FIELD_LABEL_CLASS}>Operating Route Number</div>
                            <input type="text" value={data.supervisor_operating_route_number || ''} onChange={(e) => onUpdate({ supervisor_operating_route_number: e.target.value })} placeholder="e.g. Route 12" className={INPUT_CLASS} />
                          </div>
                          <div>
                            <div className={FIELD_LABEL_CLASS}>Block number</div>
                            <input type="text" value={data.supervisor_block_number || ''} onChange={(e) => onUpdate({ supervisor_block_number: e.target.value })} placeholder="e.g. BLK-204" className={INPUT_CLASS} />
                          </div>
                          {showSupervisorRailLine && (
                            <div>
                              <div className={FIELD_LABEL_CLASS}>Rail Line</div>
                              <CustomSelect
                                value={data.supervisor_rail_line || ''}
                                onChange={(value) => onUpdate({ supervisor_rail_line: value })}
                                options={RAIL_LINE_OPTIONS.map((option) => ({ value: option, label: option }))}
                                placeholder="Select rail line"
                              />
                            </div>
                          )}
                        </div>
                      </DecisionGroup>
                    </div>
                  )}
                </div>
              </div>

              {hasSupervisorVehicleType && (
                <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                  <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Location details</h3>
                  <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Where the event happened, from your assessment.</p>
                  <div className="space-y-5">
                    {supervisorLocationUsesStreet && (
                      <>
                        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Street on <span className="text-red-500">*</span></div>
                          <input type="text" value={data.supervisor_street_on || ''} onChange={(e) => onUpdate({ supervisor_street_on: e.target.value })} placeholder="e.g. Main St" className={INPUT_CLASS} />
                        </div>
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Cross street</div>
                          <input type="text" value={data.supervisor_cross_street || ''} onChange={(e) => onUpdate({ supervisor_cross_street: e.target.value })} placeholder="e.g. Elm Ave" className={INPUT_CLASS} />
                        </div>
                        <div>
                          <div className={FIELD_LABEL_CLASS}>City <span className="text-red-500">*</span></div>
                          <input type="text" value={data.supervisor_city || ''} onChange={(e) => onUpdate({ supervisor_city: e.target.value })} placeholder="e.g. Dallas" className={INPUT_CLASS} />
                        </div>
                        <div>
                          <div className={FIELD_LABEL_CLASS}>ZIP code</div>
                          <input type="text" maxLength={5} value={data.supervisor_zip || ''} onChange={(e) => onUpdate({ supervisor_zip: e.target.value })} placeholder="e.g. 75201" className={INPUT_CLASS} />
                        </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                          <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                            <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did the event occur at a bus stop? <span className="text-red-500">*</span></div>
                            <div className="shrink-0"><YesNoButtons value={data.supervisor_event_at_bus_stop} onChange={(v) => onUpdate({ supervisor_event_at_bus_stop: v, ...(v ? {} : { supervisor_bus_stop_name: undefined }) })} /></div>
                          </div>
                          <AnimatePresence initial={false}>
                            {data.supervisor_event_at_bus_stop === true && (
                              <motion.div key="sup-bus-stop-name" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }, opacity: { duration: 0.2, ease: 'easeInOut' } }} className="overflow-hidden bg-slate-50/60">
                                <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                                  <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Name of the bus stop <span className="text-red-500">*</span></div>
                                  <div className="w-full sm:w-64">
                                    <SearchableCombobox
                                      options={BUS_STOP_OPTIONS}
                                      value={data.supervisor_bus_stop_name || ''}
                                      onChange={(v) => onUpdate({ supervisor_bus_stop_name: v })}
                                      placeholder="Select bus stop"
                                      searchPlaceholder="Search bus stops…"
                                      emptyMessage="No bus stops match…"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                            <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Does the street have a designated bike lane?</div>
                            <div className="shrink-0"><YesNoButtons value={data.supervisor_has_bike_lane} onChange={(v) => onUpdate({ supervisor_has_bike_lane: v })} /></div>
                          </div>
                        </div>
                      </>
                    )}
                    {supervisorLocationUsesRail && (
                      <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <div className={FIELD_LABEL_CLASS}>Location category <span className="text-red-500">*</span></div>
                          <CustomSelect
                            value={data.supervisor_location_category || ''}
                            onChange={(value) => onUpdate({ supervisor_location_category: value, supervisor_station_applicable: undefined, supervisor_grade_crossing_applicable: undefined, supervisor_tunnel_location: undefined })}
                            options={RAIL_LOCATION_CATEGORY_OPTIONS}
                            placeholder="Select location type"
                          />
                        </div>
                        <AnimatePresence initial={false}>
                          {showSupervisorRailStation && (
                            <motion.div {...REVEAL_MOTION} key="supervisor-rail-station">
                              <div className={FIELD_LABEL_CLASS}>Station (if applicable)</div>
                              <input type="text" value={data.supervisor_station_applicable || ''} onChange={(e) => onUpdate({ supervisor_station_applicable: e.target.value })} placeholder="Station name" className={INPUT_CLASS} />
                            </motion.div>
                          )}
                          {showSupervisorRailGrade && (
                            <motion.div {...REVEAL_MOTION} key="supervisor-grade-crossing">
                              <div className={FIELD_LABEL_CLASS}>Grade crossing (if applicable)</div>
                              <input type="text" value={data.supervisor_grade_crossing_applicable || ''} onChange={(e) => onUpdate({ supervisor_grade_crossing_applicable: e.target.value })} placeholder="Grade crossing ID" className={INPUT_CLASS} />
                            </motion.div>
                          )}
                          {showSupervisorRailTunnel && (
                            <motion.div {...REVEAL_MOTION} key="supervisor-tunnel-location">
                              <div className={FIELD_LABEL_CLASS}>Tunnel location</div>
                              <CustomSelect value={data.supervisor_tunnel_location || ''} onChange={(value) => onUpdate({ supervisor_tunnel_location: value })} options={TUNNEL_LOCATION_OPTIONS} placeholder="Select cross passage" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="md:col-span-2">
                          <div className={FIELD_LABEL_CLASS}>Address of event</div>
                          <input type="text" value={data.supervisor_address_of_event || ''} onChange={(e) => onUpdate({ supervisor_address_of_event: e.target.value })} placeholder="Street address" className={INPUT_CLASS} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasSupervisorVehicleType && (
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Derailment, damage, and tow</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Damage, tow, and scene documentation from your assessment.</p>
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  {supervisorVehicleIsRailMode && (
                      <DecisionGroup
                        bare
                        label="Did this collision involve a derailment?"
                        value={data.supervisor_derailment_confirmed}
                        onChange={(value) => onUpdate({ supervisor_derailment_confirmed: value, ...(!value ? { supervisor_derailment_details: undefined } : {}) })}
                      >
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Derailment details</div>
                          <textarea rows={3} value={data.supervisor_derailment_details || ''} onChange={(e) => onUpdate({ supervisor_derailment_details: e.target.value })} placeholder="Track, consist, equipment, and scene details" className={TEXTAREA_CLASS} />
                        </div>
                      </DecisionGroup>
                  )}
                    <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>DART vehicle point of impact</div>
                      <div className="w-full shrink-0 sm:w-60">
                        <CustomSelect
                          value={data.supervisor_point_of_impact || ''}
                          onChange={(v) => onUpdate({ supervisor_point_of_impact: v })}
                          options={supervisorImpactOptions}
                          placeholder="Select impact point"
                        />
                      </div>
                    </div>
                    <DecisionGroup
                      bare
                      label="Was the DART vehicle damaged?"
                      value={data.supervisor_dart_vehicle_damaged}
                      onChange={(value) => onUpdate({
                        supervisor_dart_vehicle_damaged: value,
                        ...(!value ? { supervisor_damage_requires_tow: undefined, supervisor_damage_count: undefined, supervisor_tow_count: undefined, supervisor_impact_markers: [], supervisor_damage_area: [] } : {}),
                      })}
                    >
                      <div className="divide-y divide-slate-200/60">
                        <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did the DART vehicle need to be towed?</div>
                          <div className="shrink-0"><YesNoButtons value={data.supervisor_damage_requires_tow} onChange={(value) => onUpdate({ supervisor_damage_requires_tow: value, ...(!value ? { supervisor_tow_count: undefined } : {}) })} /></div>
                        </div>
                        <AnimatePresence initial={false}>
                          {showSupervisorDartTowCount && (
                            <motion.div {...REVEAL_MOTION} key="dart-tow-count" className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                              <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Number of DART vehicles towed?</div>
                              <div className="shrink-0"><input type="number" min={0} value={data.supervisor_tow_count ?? ''} onChange={(e) => updateSupervisorCount('supervisor_tow_count', e.target.value)} className="dart-input-base w-full text-center sm:w-24" /></div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="py-3 first:pt-0 last:pb-0">
                          <VehicleImpactDiagram
                            variant={supervisorImpactVariant}
                            markers={data.supervisor_impact_markers || []}
                            onChange={(markers) => onUpdate({ supervisor_impact_markers: markers })}
                          />
                        </div>
                      </div>
                    </DecisionGroup>
                  </div>
                </div>
              </div>
              )}

              {sceneDocumentationSection}

              </div>
              )}

              {supervisorReviewStep === 2 && (() => {
                // Auto-sync legacy count fields so review, drawer, and reviewer decision keep working.
                const syncPeople = (people: PMPersonRecord[]) => {
                  const passengers = people.filter(p => p.role === 'Passenger');
                  const pedestrians = people.filter(p => p.role === 'Pedestrian');
                  const passengerInjured = passengers.filter(p => p.outcome === 'Injured').length;
                  const pedestrianInjured = pedestrians.filter(p => p.outcome === 'Injured').length;
                  const employeeInjured = people.filter(p => p.is_dart_employee && p.outcome === 'Injured').length + (data.supervisor_operator_injured ? 1 : 0);
                  const employeeTransported = people.filter(p => p.is_dart_employee && p.transported_to_hospital).length + (data.supervisor_operator_transported ? 1 : 0);
                  onUpdate({
                    supervisor_people: people,
                    supervisor_passenger_injuries: passengerInjured > 0,
                    supervisor_passenger_injury_count: passengerInjured > 0 ? passengerInjured : undefined,
                    supervisor_pedestrian_injuries: pedestrianInjured > 0,
                    supervisor_pedestrian_injury_count: pedestrianInjured > 0 ? pedestrianInjured : undefined,
                    supervisor_dart_employee_injuries: employeeInjured > 0,
                    supervisor_dart_employee_injury_count: employeeInjured > 0 ? employeeInjured : undefined,
                    supervisor_dart_employee_hospital_transport_count: employeeTransported > 0 ? employeeTransported : undefined,
                  });
                };
                const supervisorPeople = data.supervisor_people ?? [];
                // KPI banner numbers — same shape as Operator's Step 3, adapted to supervisor_* fields.
                const supPassengerCount = data.supervisor_passengers_on_board || 0;
                const supPedestrians = supervisorPeople.filter(p => p.role === 'Pedestrian');
                const supOtherVehicles = data.supervisor_other_vehicles ?? [];
                const supOtherOccupants = supOtherVehicles.reduce((s, v) => s + (v.occupants ?? 0), 0);
                const supOtherInjuries = supOtherVehicles.reduce((s, v) => s + (v.injuries ?? 0), 0);
                const supOtherTransported = supOtherVehicles.reduce((s, v) => {
                  const perRow = (v.injured_occupants ?? []).filter(o => o.transported === 'yes').length;
                  return s + (perRow > 0 ? perRow : (v.transported ?? 0));
                }, 0);
                const supTotalPeople = 1 /* operator */ + supPassengerCount + supPedestrians.length + supOtherOccupants;
                const supOperatorInjured = data.supervisor_operator_injured ? 1 : 0;
                const supOperatorTransported = data.supervisor_operator_transported ? 1 : 0;
                const supEmployeesInjuredList = supervisorPeople.filter(p => p.is_dart_employee && p.outcome === 'Injured').length;
                const supPassengersInjured = supervisorPeople.filter(p => p.role === 'Passenger' && p.outcome === 'Injured').length;
                const supPedestriansInjured = supPedestrians.filter(p => p.outcome === 'Injured').length;
                const supEmployeesTransportedList = supervisorPeople.filter(p => p.is_dart_employee && p.transported_to_hospital).length;
                const supPassengersTransported = supervisorPeople.filter(p => p.role === 'Passenger' && p.transported_to_hospital).length;
                const supPedestriansTransported = supPedestrians.filter(p => p.transported_to_hospital).length;
                const supWithInjuries = supOperatorInjured + supEmployeesInjuredList + supPassengersInjured + supPedestriansInjured + supOtherInjuries;
                const supTransported = supOperatorTransported + supEmployeesTransportedList + supPassengersTransported + supPedestriansTransported + supOtherTransported;
                const supInjuredParts = [
                  { key: 'emp', glyph: 'badge', title: 'Employees', value: supOperatorInjured + supEmployeesInjuredList },
                  { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: supPassengersInjured },
                  { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: supPedestriansInjured },
                  { key: 'oth', glyph: 'directions_car', title: 'Other vehicle occupants', value: supOtherInjuries },
                ];
                const supTransportedParts = [
                  { key: 'emp', glyph: 'badge', title: 'Employees', value: supOperatorTransported + supEmployeesTransportedList },
                  { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: supPassengersTransported },
                  { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: supPedestriansTransported },
                  { key: 'oth', glyph: 'directions_car', title: 'Other vehicle occupants', value: supOtherTransported },
                ];
                return (
              <div className="dart-card dart-card--surface overflow-hidden">
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="lg:w-52 lg:shrink-0">
                    <PeopleImpactSummaryCard glyph="groups" tone="bg-[#eaf1fb] text-[#1c3570]" total={supTotalPeople} label="Total people" />
                  </div>
                  <div className="lg:flex-1">
                    <PeopleImpactSummaryCard glyph="personal_injury" tone="bg-amber-50 text-amber-600" total={supWithInjuries} label="With injuries" parts={supInjuredParts} />
                  </div>
                  <div className="lg:flex-1">
                    <PeopleImpactSummaryCard glyph="local_hospital" tone="bg-red-50 text-red-500" total={supTransported} label="Transported" parts={supTransportedParts} />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">DART operator injury</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Field Supervisor's outcome for the operator who filed the report.</p>
                {(() => {
                  const supOperatorOutcome = data.supervisor_operator_outcome
                    ?? ((data.supervisor_dart_employee_fatality_count || 0) > 0 ? 'Fatality'
                      : data.supervisor_operator_injured === true ? 'Injured'
                      : undefined);
                  const supOperatorInjury: PMInjuryRecord = data.supervisor_operator_injury_record || {
                    body_part: data.supervisor_operator_injured_body_part as PMInjuryBodyPart | undefined,
                    transported_to_hospital: data.supervisor_operator_transported,
                  };
                  const setSupOperatorOutcome = (next: 'Not Injured' | 'Injured' | 'Fatality') => {
                    if (next === 'Not Injured') {
                      onUpdate({
                        supervisor_operator_outcome: 'Not Injured',
                        supervisor_operator_injured: false,
                        supervisor_operator_injured_body_part: undefined,
                        supervisor_operator_transported: undefined,
                        supervisor_operator_injury_record: undefined,
                        supervisor_dart_employee_fatalities: false,
                        supervisor_dart_employee_fatality_count: undefined,
                        supervisor_dart_employee_fatality_details: [],
                        supervisor_dart_employee_injuries: false,
                        supervisor_dart_employee_injury_count: undefined,
                      });
                    } else if (next === 'Fatality') {
                      onUpdate({
                        supervisor_operator_outcome: 'Fatality',
                        supervisor_operator_injured: false,
                        supervisor_operator_injured_body_part: undefined,
                        supervisor_operator_transported: undefined,
                        supervisor_operator_injury_record: undefined,
                        supervisor_dart_employee_fatalities: true,
                        supervisor_dart_employee_fatality_count: 1,
                        supervisor_dart_employee_fatality_details: [{ is_dart_employee: true }],
                        supervisor_dart_employee_injuries: false,
                        supervisor_dart_employee_injury_count: undefined,
                      });
                    } else {
                      onUpdate({
                        supervisor_operator_outcome: 'Injured',
                        supervisor_operator_injured: true,
                        supervisor_operator_injured_body_part: supOperatorInjury.body_part,
                        supervisor_operator_transported: supOperatorInjury.transported_to_hospital,
                        supervisor_operator_injury_record: { ...supOperatorInjury },
                        supervisor_dart_employee_injuries: true,
                        supervisor_dart_employee_injury_count: 1,
                        supervisor_dart_employee_fatalities: false,
                        supervisor_dart_employee_fatality_count: undefined,
                        supervisor_dart_employee_fatality_details: [],
                      });
                    }
                  };
                  const patchSupInjury = (patch: Partial<PMInjuryRecord>) => {
                    const next: PMInjuryRecord = { ...supOperatorInjury, ...patch };
                    onUpdate({
                      supervisor_operator_injury_record: next,
                      supervisor_operator_injured_body_part: next.body_part,
                      supervisor_operator_transported: next.transported_to_hospital,
                    });
                  };
                  return (
                    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                      <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                        <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Outcome</div>
                        <div className="w-full sm:w-72">
                          <CustomSelect
                            value={supOperatorOutcome || ''}
                            onChange={(v) => setSupOperatorOutcome(v as 'Not Injured' | 'Injured' | 'Fatality')}
                            options={[
                              { value: 'Fatality', label: 'Fatal' },
                              { value: 'Injured', label: 'Injured' },
                              { value: 'Not Injured', label: 'Not Injured' },
                            ]}
                            placeholder="Select outcome"
                          />
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {supOperatorOutcome === 'Injured' && (
                          <motion.div key="sup-op-injured-follow" {...HEIGHT_REVEAL} className="overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                            <BoolRow label="Injured body part">
                              <div className="w-full sm:w-60">
                                <CustomSelect
                                  value={supOperatorInjury.body_part || ''}
                                  onChange={(v) => patchSupInjury({ body_part: (v || undefined) as PMInjuryBodyPart })}
                                  options={PM_INJURY_BODY_PART_OPTIONS.map((option) => ({ value: option, label: option }))}
                                  placeholder="Select"
                                />
                              </div>
                            </BoolRow>
                            <BoolRow label="Transported to hospital?">
                              <div className="w-full sm:w-72 [&_.dart-seg]:grid [&_.dart-seg]:w-full">
                                <YesNoButtons
                                  value={supOperatorInjury.transported_to_hospital}
                                  onChange={(v) => patchSupInjury({ transported_to_hospital: v })}
                                />
                              </div>
                            </BoolRow>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">People involved</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Record every passenger and pedestrian involved so follow-up and care can be handled properly.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  <BoolRow label="How many passengers were on board?" required>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={data.supervisor_passengers_on_board ?? ''}
                      onChange={(e) => onUpdate({ supervisor_passengers_on_board: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      placeholder="Enter count"
                      className="dart-input-base w-full text-center sm:w-24"
                    />
                  </BoolRow>
                  <BoolRow label="Was anyone involved in this event?">
                    <YesNoToggle
                      value={data.supervisor_people_involved}
                      onChange={(value) => {
                        const nextPeople = value ? supervisorPeople : [];
                        onUpdate({ supervisor_people_involved: value });
                        syncPeople(nextPeople);
                      }}
                    />
                  </BoolRow>
                </div>

                <AnimatePresence initial={false}>
                  {data.supervisor_people_involved === true && (
                    <motion.div
                      key="sup-people-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <PMPersonListEditor
                          people={supervisorPeople}
                          onChange={(list) => syncPeople(list)}
                          hideSeverity
                          ageOptional
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Other vehicles</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Add each other vehicle involved. Capture point of impact, damage, and occupant counts per vehicle.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  <BoolRow label="Were other vehicles involved?">
                    <YesNoToggle
                      value={data.supervisor_other_vehicles_involved}
                      onChange={(value) => {
                        const nextList = value ? (data.supervisor_other_vehicles ?? []) : [];
                        onUpdate({
                          supervisor_other_vehicles_involved: value,
                          supervisor_other_vehicles: nextList,
                          supervisor_other_vehicle_count: value ? nextList.length : undefined,
                          supervisor_other_vehicle_damage_count: value ? nextList.filter(v => v.damage).length : undefined,
                          supervisor_other_vehicle_tow_count: value ? nextList.filter(v => v.tow_away).length : undefined,
                          supervisor_collision_between_dart_vehicles: value ? nextList.some(v => v.dart_dart) : undefined,
                          ...(!value ? { supervisor_other_vehicle_records: [] } : {}),
                        });
                      }}
                    />
                  </BoolRow>
                </div>

                <AnimatePresence initial={false}>
                  {data.supervisor_other_vehicles_involved === true && (
                    <motion.div
                      key="sup-other-vehicles-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <OtherVehiclesEditor
                          vehicles={data.supervisor_other_vehicles ?? []}
                          onChange={(list) => onUpdate({
                            supervisor_other_vehicles: list,
                            supervisor_other_vehicle_count: list.length || undefined,
                            supervisor_other_vehicle_damage_count: list.filter(v => v.damage).length || undefined,
                            supervisor_other_vehicle_tow_count: list.filter(v => v.tow_away).length || undefined,
                            supervisor_collision_between_dart_vehicles: list.some(v => v.dart_dart),
                          })}
                          injuryDetailsRequired
                          variant="supervisor"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Police information</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Officer on scene, who notified police, and the report number.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  <BoolRow label="Did the EMS arrive at the scene?">
                    <YesNoToggle
                      value={data.ems_at_scene}
                      onChange={(value) => onUpdate({ ems_at_scene: value })}
                    />
                  </BoolRow>
                  <BoolRow label="Were police called?">
                    <YesNoToggle
                      value={data.supervisor_police_called}
                      onChange={(value) => onUpdate({
                        supervisor_police_called: value,
                        ...(!value ? {
                          supervisor_police_officer_name: undefined,
                          supervisor_police_notified_by: undefined,
                          supervisor_report_city: undefined,
                          supervisor_police_report_number: undefined,
                        } : {}),
                      })}
                    />
                  </BoolRow>
                  <AnimatePresence initial={false}>
                    {data.supervisor_police_called === true && (
                      <motion.div key="sup-police-follow" {...HEIGHT_REVEAL} className="overflow-hidden bg-slate-50/50">
                        <div className="grid grid-cols-1 gap-x-5 gap-y-5 px-4 py-4 md:grid-cols-2">
                          <div>
                            <div className={FIELD_LABEL_CLASS}>Enter the name of the officer at the scene</div>
                            <input type="text" value={data.supervisor_police_officer_name || ''} onChange={(e) => onUpdate({ supervisor_police_officer_name: e.target.value })} className={INPUT_CLASS} />
                          </div>
                          <div>
                            <div className={FIELD_LABEL_CLASS}>Enter the name of the person who called the police</div>
                            <input type="text" value={data.supervisor_police_notified_by || ''} onChange={(e) => onUpdate({ supervisor_police_notified_by: e.target.value })} className={INPUT_CLASS} />
                          </div>
                          <div>
                            <div className={FIELD_LABEL_CLASS}>Report Type: Enter a city that issued the report</div>
                            <input type="text" value={data.supervisor_report_city || ''} onChange={(e) => onUpdate({ supervisor_report_city: e.target.value })} className={INPUT_CLASS} />
                          </div>
                          <div>
                            <div className={FIELD_LABEL_CLASS}>Report number</div>
                            <input type="text" value={data.supervisor_police_report_number || ''} onChange={(e) => onUpdate({ supervisor_police_report_number: e.target.value })} className={INPUT_CLASS} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              </div>
                );
              })()}

              {supervisorReviewStep === 3 && !fsInActionsMode && (
                <div className="space-y-4">
                  {renderSupervisorReviewGroup(
                    'Incident Basics',
                    'Incident timing, Field Supervisor arrival, location, vehicle, damage, tow, and scene documentation fields.',
                    1,
                    supervisorDetailsReviewFields
                  )}

                  {renderSupervisorReviewGroup(
                    'Injuries and Police',
                    'Employee, passenger, pedestrian, other vehicle occupant, and police details.',
                    2,
                    supervisorInjuryPoliceReviewFields
                  )}

                  {supervisorUploadsRecap}
                </div>
              )}

              {/* Field Supervisor Actions screen — same pattern as SPM, driven by the workflow CSV. */}
              {isSupervisorReview && supervisorReviewStep === 3 && fsInActionsMode && (
                fsConfirmedAction ? (
                  <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white p-6 md:p-8 shadow-[0_2px_12px_-2px_rgba(16,185,129,0.10)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35)]">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-[#00205B] font-['Poppins']">{fsConfirmedAction.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700 font-['Poppins']">{fsConfirmedAction.description}</p>
                        {submittedEventId && (
                          <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-white/80 px-3 py-1.5">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-900 font-['Poppins']">Case ID {submittedEventId}</span>
                          </div>
                        )}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {onBackToHome && (
                            <GlassButton variant="primary" onClick={onBackToHome}>Back to home</GlassButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ActionSelectionScreen
                    title="Choose next action"
                    description="Select what should happen next. Your choice will update the workflow status and assignment."
                    actions={buildFsActions({
                      showSendToOperator: data.is_on_behalf === true && data.operator_availability_confirmed !== false,
                    })}
                    onConfirm={(actionId, payload) => {
                      // TODO: swap for workflow engine calls when the API lands.
                      let confirmationTitle = 'Section submitted';
                      let confirmationDescription = 'Your Field Supervisor section has been submitted.';
                      switch (actionId) {
                        case 'send-to-assistant-manager':
                          onSubmit();
                          confirmationTitle = 'Sent to Assistant Manager';
                          confirmationDescription = 'The report has been submitted to the Assistant Manager for review. You will be notified when they take action.';
                          break;
                        case 'send-to-operator':
                          onSubmit();
                          confirmationTitle = 'Sent to Operator';
                          confirmationDescription = 'The report has been routed to the Operator to complete their section.';
                          break;
                      }
                      setFsConfirmedAction({ actionId, title: confirmationTitle, description: confirmationDescription });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )
              )}

              {supervisorReviewStep < supervisorSectionStepCount && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                {supervisorReviewStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setSupervisorReviewStep(Math.max(1, supervisorReviewStep - 1))}
                    className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  >
                    {supervisorReviewStep === 2 ? 'Back to details' : 'Back to injuries'}
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
                  <GlassButton variant="primary" onClick={() => {
                    if (supervisorReviewStep === 1) {
                      const missing = supervisorRequiredReviewItems.filter((item) => item.step === 1);
                      if (missing.length > 0) {
                        setSupervisorSubStep1Attempted(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }
                    }
                    setSupervisorReviewStep(supervisorReviewStep + 1);
                  }}>
                    {supervisorReviewStep === 1 ? 'Continue to injuries' : 'Continue to review'}
                  </GlassButton>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        <OperatorReportDrawer
          open={isSupervisorReview && isOperatorReportOpen}
          onClose={() => setIsOperatorReportOpen(false)}
          data={data}
          operatorStatus={sectionStatuses?.operator.status}
        />

        {isProgramManagerReview && (() => {
          const modeIsBus = data.mode === 'Bus';
          const modeIsRail = data.mode === 'Light Rail Vehicle' || data.mode === 'Streetcar' || data.mode === 'Hi-Rail';
          const modeIsLRV = data.mode === 'Light Rail Vehicle';
          // Diagram variant follows the vehicle mode captured at report initiation — same lookup Op/FS use.
          const pmImpactVariant: 'bus' | 'rail' | 'streetcar' | 'nrv' =
            data.mode === 'Light Rail Vehicle' ? 'rail'
            : data.mode === 'Streetcar' ? 'streetcar'
            : data.mode === 'Hi-Rail' || data.mode === 'Non-Revenue Vehicle' || data.mode === 'NRV' ? 'nrv'
            : 'bus';
          const isEventCollision = data.event_type === 'Collision';
          const isEventDerailment = data.event_type === 'Derailment';
          // Per spec: Other vehicle collision type only applies when the DART vehicle collided with
          // another vehicle that has occupants (Auto, Motorcycle/Scooter, Transit, Emergency).
          // Hide for Pedestrian / Bicyclist / Animal / Fixed / Non-Fixed Object collisions.
          const pmCollisionWith = data.program_manager_collision_with || '';
          const pmShowOtherVehicleCollisionType = isEventCollision && (
            pmCollisionWith.startsWith('Collision – with Auto') ||
            pmCollisionWith === 'Collision – with Motorcycle/Scooter' ||
            pmCollisionWith === 'Collision – with Transit vehicle' ||
            pmCollisionWith === 'Collision – with Emergency vehicle'
          );
          const derailmentApplies = isEventDerailment || (isEventCollision && data.supervisor_derailment_confirmed === true);
          const invalidDerailmentMode = isEventDerailment && !modeIsRail;
          const contributingFactorsList = data.program_manager_contributing_factors_list || [];

          const pmEmployeeInjuryRecords = resizePMInjuryRecords(data.program_manager_employee_injury_records, data.program_manager_employee_injury_count);
          const pmEmployeeFatalityRecords = resizeDemographicRecords(data.program_manager_employee_fatality_records, data.program_manager_employee_fatality_count);
          const pmOtherVehicleFatalityRecords = resizeDemographicRecords(data.program_manager_other_vehicle_fatality_records, data.program_manager_other_vehicle_fatality_count);
          const pmOtherVehicleInjuryRecords = resizePMInjuryRecords(data.program_manager_other_vehicle_injury_records, data.program_manager_other_vehicle_injury_count);

          // People involved (passengers + pedestrians) now live as per-person records so
          // fatality/injury counts and hospital transports derive directly from the list.
          const pmPeople = data.program_manager_people || [];
          const pmPax = pmPeople.filter(p => p.role === 'Passenger');
          const pmPed = pmPeople.filter(p => p.role === 'Pedestrian');

          // KPI numbers for the impact banner — mirrors the Operator/FS People and Impact treatment.
          const pmEmpFatCount = data.program_manager_employee_fatality_count || 0;
          const pmPaxFatCount = pmPax.filter(p => p.outcome === 'Fatality').length;
          const pmPedFatCount = pmPed.filter(p => p.outcome === 'Fatality').length;
          const pmOvFatCount = data.program_manager_other_vehicle_fatality_count || 0;
          const pmTotalFatalities = pmEmpFatCount + pmPaxFatCount + pmPedFatCount + pmOvFatCount;
          const pmEmpInjCount = data.program_manager_employee_injury_count || 0;
          const pmPaxInjCount = pmPax.filter(p => p.outcome === 'Injured').length;
          const pmPedInjCount = pmPed.filter(p => p.outcome === 'Injured').length;
          const pmOvInjCount = data.program_manager_other_vehicle_injury_count || 0;
          const pmTotalInjured = pmEmpInjCount + pmPaxInjCount + pmPedInjCount + pmOvInjCount;
          const pmEmpTransported = pmEmployeeInjuryRecords.filter(r => r.transported_to_hospital).length;
          const pmPaxTransported = pmPax.filter(p => p.outcome === 'Injured' && p.transported_to_hospital).length;
          const pmPedTransported = pmPed.filter(p => p.outcome === 'Injured' && p.transported_to_hospital).length;
          const pmOvTransported = (data.program_manager_other_vehicles ?? [])
            .reduce((s, veh) => s + (veh.injured_occupants ?? []).filter(o => o.transported === 'yes').length, 0);
          const pmTotalTransported = pmEmpTransported + pmPaxTransported + pmPedTransported + pmOvTransported;
          const pmFatalityParts = [
            { key: 'emp', glyph: 'badge', title: 'Employees', value: pmEmpFatCount },
            { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: pmPaxFatCount },
            { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: pmPedFatCount },
            { key: 'ov', glyph: 'directions_car', title: 'Other vehicle', value: pmOvFatCount },
          ];
          const pmInjuredParts = [
            { key: 'emp', glyph: 'badge', title: 'Employees', value: pmEmpInjCount },
            { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: pmPaxInjCount },
            { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: pmPedInjCount },
            { key: 'ov', glyph: 'directions_car', title: 'Other vehicle', value: pmOvInjCount },
          ];
          const pmTransportedParts = [
            { key: 'emp', glyph: 'badge', title: 'Employees', value: pmEmpTransported },
            { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: pmPaxTransported },
            { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: pmPedTransported },
            { key: 'ov', glyph: 'directions_car', title: 'Other vehicle', value: pmOvTransported },
          ];

          const updatePMInjuryRecord = (
            field:
              | 'program_manager_employee_injury_records'
              | 'program_manager_passenger_injury_records'
              | 'program_manager_pedestrian_injury_records'
              | 'program_manager_other_vehicle_injury_records',
            records: PMInjuryRecord[],
            index: number,
            patch: Partial<PMInjuryRecord>
          ) => {
            onUpdate({ [field]: records.map((record, i) => (i === index ? { ...record, ...patch } : record)) } as Partial<AccidentReportData>);
          };

          const updatePMFatalityRecord = (
            field:
              | 'program_manager_employee_fatality_records'
              | 'program_manager_passenger_fatality_records'
              | 'program_manager_pedestrian_fatality_records'
              | 'program_manager_other_vehicle_fatality_records',
            records: SupervisorDemographicRecord[],
            index: number,
            patch: Partial<SupervisorDemographicRecord>
          ) => {
            onUpdate({ [field]: records.map((record, i) => (i === index ? { ...record, ...patch } : record)) } as Partial<AccidentReportData>);
          };

          const renderPMFatalityRecords = (
            records: SupervisorDemographicRecord[],
            field:
              | 'program_manager_employee_fatality_records'
              | 'program_manager_passenger_fatality_records'
              | 'program_manager_pedestrian_fatality_records'
              | 'program_manager_other_vehicle_fatality_records',
            title: string,
          ) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {records.map((record, index) => (
                <div key={`${field}-${index}`} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <div className="md:col-span-2 text-xs font-semibold text-slate-700 font-['Poppins']">{title} #{index + 1}</div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Age</div>
                    <CustomSelect
                      value={record.age_group || ''}
                      onChange={(v) => updatePMFatalityRecord(field, records, index, { age_group: (v || undefined) as SupervisorDemographicRecord['age_group'] })}
                      options={AGE_GROUP_OPTIONS.map((option) => ({ value: option, label: option }))}
                      placeholder="Select age"
                    />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Gender</div>
                    <CustomSelect
                      value={record.gender || ''}
                      onChange={(v) => updatePMFatalityRecord(field, records, index, { gender: (v || undefined) as SupervisorDemographicRecord['gender'] })}
                      options={GENDER_OPTIONS.map((option) => ({ value: option, label: option }))}
                      placeholder="Select gender"
                    />
                  </div>
                </div>
              ))}
            </div>
          );

          const renderPMInjuryRecords = (
            records: PMInjuryRecord[],
            field:
              | 'program_manager_employee_injury_records'
              | 'program_manager_passenger_injury_records'
              | 'program_manager_pedestrian_injury_records'
              | 'program_manager_other_vehicle_injury_records',
            title: string,
            includeDemographics: boolean,
          ) => (
            <div className="grid grid-cols-1 gap-3">
              {records.map((record, index) => (
                <div key={`${field}-${index}`} className={`grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 ${includeDemographics ? 'md:grid-cols-3' : 'md:grid-cols-3'}`}>
                  <div className={`text-xs font-semibold text-slate-700 font-['Poppins'] ${includeDemographics ? 'md:col-span-3' : 'md:col-span-3'}`}>{title} #{index + 1}</div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Injury severity</div>
                    <CustomSelect
                      value={record.severity || ''}
                      onChange={(v) => updatePMInjuryRecord(field, records, index, { severity: (v || undefined) as PMInjurySeverity })}
                      options={PM_INJURY_SEVERITY_OPTIONS.map((option) => ({ value: option, label: option }))}
                      placeholder="Select severity"
                    />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Injured body part</div>
                    <CustomSelect
                      value={record.body_part || ''}
                      onChange={(v) => updatePMInjuryRecord(field, records, index, { body_part: (v || undefined) as PMInjuryBodyPart })}
                      options={PM_INJURY_BODY_PART_OPTIONS.map((option) => ({ value: option, label: option }))}
                      placeholder="Select body part"
                    />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Transported to hospital</div>
                    <YesNoButtons value={record.transported_to_hospital} onChange={(value) => updatePMInjuryRecord(field, records, index, { transported_to_hospital: value })} />
                  </div>
                  {includeDemographics && (
                    <>
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Age</div>
                        <CustomSelect
                          value={record.age_group || ''}
                          onChange={(v) => updatePMInjuryRecord(field, records, index, { age_group: (v || undefined) as SupervisorDemographicRecord['age_group'] })}
                          options={AGE_GROUP_OPTIONS.map((option) => ({ value: option, label: option }))}
                          placeholder="Select age"
                        />
                      </div>
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Gender</div>
                        <CustomSelect
                          value={record.gender || ''}
                          onChange={(v) => updatePMInjuryRecord(field, records, index, { gender: (v || undefined) as SupervisorDemographicRecord['gender'] })}
                          options={GENDER_OPTIONS.map((option) => ({ value: option, label: option }))}
                          placeholder="Select gender"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          );

          const eventLocationSummary = [data.street_on, data.cross_street].filter(Boolean).join(' & ') || data.address_of_event || '—';
          const incidentDateTimeSummary = data.incident_date && data.incident_time ? `${data.incident_date} at ${data.incident_time}` : data.incident_date || '—';

          return (
          <div className="space-y-5">
            {isProgramManagerReview && data.pm_on_hold && (
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-900 font-['Poppins']">This case is on hold</p>
                    <p className="mt-0.5 text-xs text-indigo-800/80 font-['Poppins']">
                      {data.pm_hold_note || 'Parked in your queue. It will not move until you take an action.'}
                    </p>
                    {data.operator_availability_confirmed === false && (
                      <p className="mt-1 text-xs text-indigo-800/80 font-['Poppins']">
                        Un-holding sends the operator their section to complete, then returns the case to you to close.
                      </p>
                    )}
                  </div>
                </div>
                {pmOnResume && (
                  <button
                    type="button"
                    onClick={pmOnResume}
                    className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 hover:border-indigo-400 hover:bg-indigo-50 font-['Poppins']"
                  >
                    Unhold
                  </button>
                )}
              </div>
            )}
            {/* Case references — available on every step so the PM can check source reports while they work */}
            {isProgramManagerReview && (pmOnOpenOperatorReport || pmOnOpenSupervisorReport || pmOnOpenActivity) && (
              <div className="dart-card dart-card--surface flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#00205B]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00205B] font-['Poppins']">
                    <ShieldCheck className="h-3 w-3" />
                    Case references
                  </span>
                  <span className="dart-caption hidden sm:inline">Open any source report while you work.</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {pmOnOpenOperatorReport && (
                    <button
                      type="button"
                      onClick={pmOnOpenOperatorReport}
                      className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Operator report
                    </button>
                  )}
                  {pmOnOpenSupervisorReport && (
                    <button
                      type="button"
                      onClick={pmOnOpenSupervisorReport}
                      className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Supervisor report
                    </button>
                  )}
                  {pmOnOpenActivity && (
                    <button
                      type="button"
                      onClick={pmOnOpenActivity}
                      className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                    >
                      Activity
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-5">

              {/* Data integrity warning — persistent across all PM steps */}
              {invalidDerailmentMode && (
                <div className="dart-card dart-card--alert-warn p-4">
                  <p className="text-sm font-semibold text-amber-900 font-['Poppins']">Event type / mode mismatch</p>
                  <p className="mt-1 text-xs text-amber-800 font-['Poppins']">
                    Derailment is only valid for Light Rail, Streetcar, or Hi-Rail. This case was filed as a Derailment on {data.mode || 'a non-rail mode'} — verify with the initiator before classifying.
                  </p>
                </div>
              )}

              {isPmStep1 && (<>
              <div className="dart-card dart-card--surface overflow-hidden">
                {pmStep1Attempted && pmMissingFields.filter((m) => m.step === 1).length > 0 && (
                  <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 md:mx-7">
                    <p className="text-sm font-semibold text-red-900 font-['Poppins']">
                      {pmMissingFields.filter((m) => m.step === 1).length === 1
                        ? 'One required field is missing'
                        : `${pmMissingFields.filter((m) => m.step === 1).length} required fields are missing`}
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-red-800 font-['Poppins']">
                      {pmMissingFields.filter((m) => m.step === 1).map((item) => (
                        <li key={`pm-step1-${item.label}`}>• {item.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Case context — read-only reference zone; one tinted panel, no inner cards so it doesn't read as inputs. */}
                <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                  <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Case context</h3>
                  <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Reference material from the operator and Field Supervisor. Read-only.</p>

                  <div className="rounded-2xl bg-slate-50/70 px-5 py-5 sm:px-6 sm:py-6">
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Date / time</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 font-['Poppins'] dart-tabular">{incidentDateTimeSummary}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Event location</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{eventLocationSummary}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Vehicle number</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 font-['Poppins'] dart-tabular">{data.vehicle_number || data.train_number || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Operating route</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{data.route_number || data.operating_route || data.rail_line || '—'}</dd>
                      </div>
                    </dl>

                    <div className="my-5 h-px w-full bg-slate-200/70" />

                    <div className="space-y-5">
                      <div>
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Submitted by operator</div>
                        <p className="text-[13.5px] leading-relaxed text-slate-800 font-['Poppins'] whitespace-pre-line">{data.description_of_event || data.incident_description || '—'}</p>
                      </div>
                      <div>
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Submitted by Field Supervisor</div>
                        <p className="text-[13.5px] leading-relaxed text-slate-800 font-['Poppins'] whitespace-pre-line">{data.supervisor_event_description || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Findings — BoolRow pattern: label left, toggle right, in a divide-y stack */}
                <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                  <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Findings</h3>
                  <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Confirm what happened based on your review.</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Is the operator date/time correct? <span className="text-red-500">*</span></div>
                      <div className="shrink-0"><YesNoButtons value={data.operator_datetime_correct} onChange={(value) => onUpdate({ operator_datetime_correct: value })} /></div>
                    </div>
                    {modeIsLRV && (
                      <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                        <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did the event occur on the shared corridor?</div>
                        <div className="shrink-0"><YesNoButtons value={data.shared_corridor} onChange={(value) => onUpdate({ shared_corridor: value })} /></div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did an equipment malfunction contribute to the incident?</div>
                      <div className="shrink-0"><YesNoButtons value={data.equipment_malfunction} onChange={(value) => onUpdate({ equipment_malfunction: value })} /></div>
                    </div>
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Was any property other than the DART vehicle damaged?</div>
                      <div className="shrink-0"><YesNoButtons value={data.damage_to_property} onChange={(value) => onUpdate({ damage_to_property: value })} /></div>
                    </div>
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did the incident occur at a grade crossing or intersection?</div>
                      <div className="shrink-0"><YesNoButtons value={data.program_manager_at_grade_crossing_or_intersection} onChange={(value) => onUpdate({ program_manager_at_grade_crossing_or_intersection: value })} /></div>
                    </div>
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did the incident require a life-safety evacuation?</div>
                      <div className="shrink-0"><YesNoButtons value={data.program_manager_life_safety_evacuation} onChange={(value) => onUpdate({ program_manager_life_safety_evacuation: value })} /></div>
                    </div>
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did the employee contact the program manager?</div>
                      <div className="shrink-0"><YesNoButtons value={data.employee_contacted_program_manager} onChange={(value) => onUpdate({ employee_contacted_program_manager: value, ...(!value ? { employee_contacted_program_manager_date: undefined } : {}) })} /></div>
                    </div>
                  <AnimatePresence initial={false}>
                    {data.employee_contacted_program_manager === true && (
                      <motion.div key="pm-contacted-date" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="bg-slate-50/60">
                        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Date employee contacted program manager</div>
                          <div className="w-full sm:w-64"><DatePickerInput value={data.employee_contacted_program_manager_date || ''} onChange={(value) => onUpdate({ employee_contacted_program_manager_date: value })} /></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </div>

                {/* Statements — police + operator action (FS statement is pulled from FS into Case context above) */}
                <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                  <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Statements</h3>
                  <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Attach the police statement and the operator's reported action.</p>
                  <div className="space-y-5">
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Police statement</div>
                      <textarea rows={4} value={data.police_statement || ''} onChange={(e) => onUpdate({ police_statement: e.target.value })} placeholder="Add police statement or notes" className={TEXTAREA_CLASS} />
                    </div>
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Action taken</div>
                      <p className="mb-2 text-xs leading-relaxed text-slate-500 font-['Poppins']">What the operator reported doing after the event.</p>
                      <textarea rows={4} value={data.action_taken || ''} onChange={(e) => onUpdate({ action_taken: e.target.value })} placeholder="Describe the operator's action after the event" className={TEXTAREA_CLASS} />
                    </div>
                  </div>
                </div>
              </div>
              </>)}

              {isPmStep2 && (<>
              <div className="dart-card dart-card--surface overflow-hidden">
              {/* Event analysis — Contributing Factors always; collision fields only when event is Collision */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Event analysis</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Select contributing factors and, for collisions, the collision context.</p>
                <div className="space-y-5">
                  {/* Collision geometry — collision rows + damage gate + diagram all in one card since they describe the same event. Independent SPM record. */}
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                    {isEventCollision && (
                      <>
                        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Collisions with</div>
                          <div className="w-full sm:w-72">
                            <CustomSelect
                              value={data.program_manager_collision_with || ''}
                              onChange={(value) => onUpdate({ program_manager_collision_with: value })}
                              options={PROGRAM_MANAGER_COLLISION_WITH_OPTIONS}
                              placeholder="Select collision type"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>DART vehicle collision type</div>
                          <div className="w-full sm:w-72">
                            <CustomSelect
                              value={data.program_manager_other_collision_type || ''}
                              onChange={(value) => onUpdate({ program_manager_other_collision_type: value })}
                              options={PROGRAM_MANAGER_COLLISION_TYPE_OPTIONS}
                              placeholder="Select collision type"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>DART vehicle action</div>
                          <div className="w-full sm:w-72">
                            <CustomSelect
                              value={data.program_manager_dart_action || ''}
                              onChange={(value) => onUpdate({ program_manager_dart_action: value })}
                              options={PROGRAM_MANAGER_DART_ACTION_OPTIONS}
                              placeholder="Select action"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0, textTransform: 'none' }}>DART vehicle point of impact</div>
                          <div className="w-full sm:w-72">
                            <CustomSelect
                              value={data.program_manager_dart_collision_type || ''}
                              onChange={(value) => onUpdate({ program_manager_dart_collision_type: value })}
                              options={PROGRAM_MANAGER_DART_POINT_OF_IMPACT_OPTIONS}
                              placeholder="Select point of impact"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Was the DART vehicle damaged?</div>
                      <div className="w-full sm:w-72 [&_.dart-seg]:grid [&_.dart-seg]:w-full">
                        <YesNoButtons
                          value={data.program_manager_dart_vehicle_damaged}
                          onChange={(v) => onUpdate({
                            program_manager_dart_vehicle_damaged: v,
                            ...(v ? {} : { program_manager_impact_markers: [], program_manager_disabling_damage: undefined }),
                          })}
                        />
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {data.program_manager_dart_vehicle_damaged === true && (
                        <motion.div
                          key="pm-impact-diagram"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                          className="overflow-hidden bg-slate-50/40"
                        >
                          <div className="flex flex-col gap-2.5 border-b border-slate-200/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                            <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Was there disabling damage to this vehicle?</div>
                            <div className="w-full sm:w-72 [&_.dart-seg]:grid [&_.dart-seg]:w-full">
                              <YesNoButtons
                                value={data.program_manager_disabling_damage}
                                onChange={(v) => onUpdate({ program_manager_disabling_damage: v })}
                              />
                            </div>
                          </div>
                          <div className="px-4 py-5 sm:px-5">
                            <VehicleImpactDiagram
                              variant={pmImpactVariant}
                              markers={data.program_manager_impact_markers || []}
                              onChange={(markers) => onUpdate({ program_manager_impact_markers: markers })}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <ContributingFactorsPicker
                      selected={contributingFactorsList}
                      onSelectedChange={(next) => {
                        const patch: Partial<typeof data> = { program_manager_contributing_factors_list: next };
                        // Clear the legacy primary field if the previously-primary factor was removed.
                        if (data.program_manager_primary_contributing_factor && !next.includes(data.program_manager_primary_contributing_factor)) {
                          patch.program_manager_primary_contributing_factor = undefined;
                        }
                        onUpdate(patch);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Derailment details — visible when event is Derailment or a Collision resulted in derailment */}
              {derailmentApplies && (
                <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                  <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Derailment details</h3>
                  <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Rail-specific configuration and cars derailed.</p>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Derail configuration</div>
                      <CustomSelect
                        value={data.program_manager_derail_configuration || ''}
                        onChange={(value) => onUpdate({ program_manager_derail_configuration: value })}
                        options={PROGRAM_MANAGER_DERAIL_CONFIG_OPTIONS}
                        placeholder="Select configuration"
                      />
                    </div>
                    {modeIsLRV && (
                      <div>
                        <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Number of cars derailed</div>
                          <div className="shrink-0"><input
                            type="number"
                            min={0}
                            value={data.program_manager_cars_derailed_count ?? ''}
                            onChange={(e) => onUpdate({ program_manager_cars_derailed_count: parseOptionalCount(e.target.value) })}
                            className="dart-input-base w-full text-center sm:w-24"
                          /></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Damage and tow */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Damage and tow</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Damage estimates and vehicle tow disposition.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  {modeIsBus && (
                    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                      <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Estimated total damages</div>
                      <div className="w-full sm:w-48">
                        <input
                          type="text"
                          value={data.program_manager_estimated_total_damages || ''}
                          onChange={(e) => onUpdate({ program_manager_estimated_total_damages: e.target.value })}
                          placeholder="e.g. $12,500"
                          className="dart-input-base w-full text-right dart-tabular"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                    <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Did this event result in a tow-away?</div>
                    <div className="shrink-0">
                      <YesNoButtons value={data.program_manager_tow_away} onChange={(value) => onUpdate({ program_manager_tow_away: value, ...(!value ? { program_manager_tow_away_vehicle: undefined } : {}) })} />
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {data.program_manager_tow_away === true && (
                      <motion.div key="pm-tow-what" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }, opacity: { duration: 0.2, ease: 'easeInOut' } }} className="overflow-hidden bg-slate-50/60">
                        <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                          <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>What vehicle was towed?</div>
                          <div className="w-full sm:w-64">
                            <CustomSelect
                              value={data.program_manager_tow_away_vehicle || ''}
                              onChange={(value) => onUpdate({ program_manager_tow_away_vehicle: value as AccidentReportData['program_manager_tow_away_vehicle'] })}
                              options={PM_TOW_AWAY_VEHICLE_OPTIONS}
                              placeholder="Select what was towed"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              </div>
              </>)}

              {isPmStep3 && (<>
              <div className="dart-card dart-card--surface overflow-hidden">
              {/* Impact banner — mirrors the Operator/FS People and Impact KPI treatment. */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <PeopleImpactSummaryCard glyph="crisis_alert" tone="bg-red-50 text-red-600" total={pmTotalFatalities} label="Fatalities" parts={pmFatalityParts} />
                  <PeopleImpactSummaryCard glyph="personal_injury" tone="bg-amber-50 text-amber-600" total={pmTotalInjured} label="With injuries" parts={pmInjuredParts} />
                  <PeopleImpactSummaryCard glyph="local_hospital" tone="bg-red-50 text-red-500" total={pmTotalTransported} label="Transported" parts={pmTransportedParts} />
                </div>
              </div>

              {/* DART operator injury — single-record outcome flow (the operator submitted the report). */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">DART operator injury</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Program Manager's outcome for the operator who filed the report.</p>
                {(() => {
                  const operatorOutcome = data.program_manager_operator_outcome
                    ?? ((data.program_manager_employee_fatality_count || 0) > 0 ? 'Fatality'
                      : (data.program_manager_employee_injury_count || 0) > 0 ? 'Injured'
                      : undefined);
                  const operatorFatality = data.program_manager_employee_fatality_records?.[0] || {};
                  const operatorInjury = data.program_manager_employee_injury_records?.[0] || {};
                  const setOperatorOutcome = (next: 'Not Injured' | 'Injured' | 'Fatality') => {
                    if (next === 'Not Injured') {
                      onUpdate({
                        program_manager_operator_outcome: 'Not Injured',
                        program_manager_employee_fatality_count: 0,
                        program_manager_employee_fatality_records: [],
                        program_manager_employee_injury_count: 0,
                        program_manager_employee_injury_records: [],
                      });
                    } else if (next === 'Fatality') {
                      onUpdate({
                        program_manager_operator_outcome: 'Fatality',
                        program_manager_employee_fatality_count: 1,
                        program_manager_employee_fatality_records: [{ ...operatorFatality, is_dart_employee: true }],
                        program_manager_employee_injury_count: 0,
                        program_manager_employee_injury_records: [],
                      });
                    } else {
                      onUpdate({
                        program_manager_operator_outcome: 'Injured',
                        program_manager_employee_injury_count: 1,
                        program_manager_employee_injury_records: [{ ...operatorInjury }],
                        program_manager_employee_fatality_count: 0,
                        program_manager_employee_fatality_records: [],
                      });
                    }
                  };
                  const patchFatality = (patch: Partial<SupervisorDemographicRecord>) => {
                    onUpdate({
                      program_manager_employee_fatality_records: [{ ...operatorFatality, ...patch, is_dart_employee: true }],
                      program_manager_employee_fatality_count: 1,
                    });
                  };
                  const patchInjury = (patch: Partial<PMInjuryRecord>) => {
                    onUpdate({
                      program_manager_employee_injury_records: [{ ...operatorInjury, ...patch }],
                      program_manager_employee_injury_count: 1,
                    });
                  };
                  return (
                    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                      <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                        <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Outcome</div>
                        <div className="w-full sm:w-72">
                          <CustomSelect
                            value={operatorOutcome || ''}
                            onChange={(v) => setOperatorOutcome(v as 'Not Injured' | 'Injured' | 'Fatality')}
                            options={[
                              { value: 'Fatality', label: 'Fatal' },
                              { value: 'Injured', label: 'Injured' },
                              { value: 'Not Injured', label: 'Not Injured' },
                            ]}
                            placeholder="Select outcome"
                          />
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {operatorOutcome === 'Injured' && (
                          <motion.div key="pm-op-injured-follow" {...HEIGHT_REVEAL} className="overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                            <BoolRow label="Injury severity">
                              <div className="w-full sm:w-60">
                                <CustomSelect
                                  value={operatorInjury.severity || ''}
                                  onChange={(v) => patchInjury({ severity: (v || undefined) as PMInjurySeverity })}
                                  options={PM_INJURY_SEVERITY_OPTIONS.map((option) => ({ value: option, label: option }))}
                                  placeholder="Select severity"
                                />
                              </div>
                            </BoolRow>
                            <BoolRow label="Injured body part">
                              <div className="w-full sm:w-60">
                                <CustomSelect
                                  value={operatorInjury.body_part || ''}
                                  onChange={(v) => patchInjury({ body_part: (v || undefined) as PMInjuryBodyPart })}
                                  options={PM_INJURY_BODY_PART_OPTIONS.map((option) => ({ value: option, label: option }))}
                                  placeholder="Select"
                                />
                              </div>
                            </BoolRow>
                            <BoolRow label="Transported to hospital?">
                              <div className="w-full sm:w-72 [&_.dart-seg]:grid [&_.dart-seg]:w-full">
                                <YesNoButtons
                                  value={operatorInjury.transported_to_hospital}
                                  onChange={(v) => patchInjury({ transported_to_hospital: v })}
                                />
                              </div>
                            </BoolRow>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </div>

              {/* People involved — gate first, then add-person editor mirrors Op/FS pattern. */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">People involved</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Record every passenger or pedestrian affected so follow-up and care can be handled properly.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  <BoolRow label="Was anyone involved in this event?">
                    <YesNoToggle
                      value={data.program_manager_people_involved}
                      onChange={(v) => onUpdate({
                        program_manager_people_involved: v,
                        ...(v ? {} : { program_manager_people: [] }),
                      })}
                    />
                  </BoolRow>
                </div>
                <AnimatePresence initial={false}>
                  {data.program_manager_people_involved === true && (
                    <motion.div
                      key="pm-people-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <PMPersonListEditor
                          people={pmPeople}
                          onChange={(people) => onUpdate({ program_manager_people: people })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other vehicles — use shared OtherVehiclesEditor to match Field Supervisor UX. */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Other vehicles</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Add each vehicle involved besides the DART vehicle. Occupants are recorded as counts; use the fields below to provide PM fatality/injury details if needed.</p>
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
                    <div className={FIELD_LABEL_CLASS} style={{ marginBottom: 0 }}>Were other vehicles involved?</div>
                    <div className="shrink-0"><YesNoButtons value={data.program_manager_other_vehicles_involved} onChange={(value) => {
                      const nextList = value ? (data.program_manager_other_vehicles ?? []) : [];
                      onUpdate({
                        program_manager_other_vehicles_involved: value,
                        program_manager_other_vehicles: nextList,
                        program_manager_other_vehicle_fatality_count: value ? nextList.reduce((s, v) => s + (v.fatalities || 0), 0) : undefined,
                        program_manager_other_vehicle_injury_count: value ? nextList.reduce((s, v) => s + (v.injuries || 0), 0) : undefined,
                      });
                    }} /></div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {data.program_manager_other_vehicles_involved === true && (
                    <motion.div
                      key="pm-other-vehicles-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <OtherVehiclesEditor
                          vehicles={data.program_manager_other_vehicles ?? []}
                          onChange={(list) => {
                            const damagedIds = list.filter(v => v.disabling_damage === true).map(v => v.id);
                            const anyAnswered = list.some(v => v.disabling_damage !== undefined);
                            onUpdate({
                              program_manager_other_vehicles: list,
                              program_manager_other_vehicle_fatality_count: list.reduce((s, v) => s + (v.fatalities || 0), 0) || undefined,
                              program_manager_other_vehicle_injury_count: list.reduce((s, v) => s + (v.injuries || 0), 0) || undefined,
                              program_manager_other_vehicles_disabling_damage_present: anyAnswered ? damagedIds.length > 0 : undefined,
                              program_manager_other_vehicles_disabling_damage_vehicle_ids: damagedIds.length > 0 ? damagedIds : undefined,
                            });
                          }}
                          injuryDetailsRequired
                          variant="pm"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>
              </>)}

              {isPmStep4 && (<>
              <div className="dart-card dart-card--surface overflow-hidden">
              {pmClassifyAttempted && pmMissingFields.filter((m) => m.step === 4).length > 0 && (
                <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 md:mx-7">
                  <p className="text-sm font-semibold text-red-900 font-['Poppins']">
                    {pmMissingFields.filter((m) => m.step === 4).length === 1
                      ? 'One required field is missing'
                      : `${pmMissingFields.filter((m) => m.step === 4).length} required fields are missing`}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-red-800 font-['Poppins']">
                    {pmMissingFields.filter((m) => m.step === 4).map((item) => (
                      <li key={`pm-step4-${item.label}`}>• {item.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Classification decision */}
              <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Classification</h3>
                <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Your judgment closes the case. This becomes part of the permanent record.</p>
                <div className="space-y-5">
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Classification <span className="text-red-500">*</span></div>
                    <CustomSelect
                      value={data.program_manager_classification_value || ''}
                      onChange={(value) => onUpdate({
                        program_manager_classification_value: value as PMClassification,
                        program_manager_classification: value,
                      })}
                      options={PROGRAM_MANAGER_CLASSIFICATION_OPTIONS}
                      placeholder="Select classification decision"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Date classified <span className="text-red-500">*</span></div>
                      <DatePickerInput value={data.program_manager_classification_date || ''} onChange={(value) => onUpdate({ program_manager_classification_date: value })} />
                    </div>
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Program manager who classified</div>
                      <p className="mt-1 text-sm font-medium text-slate-800 font-['Poppins']">{data.program_manager_classified_by_name || <span className="font-normal text-slate-400">Auto-filled on submit</span>}</p>
                    </div>
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Justification of classification <span className="text-red-500">*</span></div>
                    <textarea
                      rows={4}
                      value={data.program_manager_classification_justification || ''}
                      onChange={(e) => onUpdate({ program_manager_classification_justification: e.target.value })}
                      placeholder="Explain the reasoning behind this classification"
                      className={TEXTAREA_CLASS}
                    />
                  </div>
                </div>
              </div>
              </div>

              {roleAttachmentsSection}
              </>)}

              {isPmStep5 && !pmInActionsMode && (<>
              {/* PM Review — the final read-only summary of the form.
                  This is the last step of the form task. Confirming here does NOT
                  yet transition the workflow; it just signals the SPM has read the
                  content. "Continue to next action" moves to a separate Actions
                  screen (outside the stepper) where the workflow transition is
                  actually chosen and committed. */}
              <div className="dart-card dart-card--surface overflow-hidden">
                <div className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
                  <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Review your classification</h3>
                  <p className="mb-5 mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">Review everything you entered before choosing the next workflow action. Use Edit to jump back to any step.</p>

                  <div className="space-y-4">
                    {renderPmReviewGroup(
                      'Investigation Basics',
                      'Findings, employee-to-PM contact, and statements collected during your review.',
                      1,
                      [
                        { label: 'Operator date/time correct', value: formatReviewValue(data.operator_datetime_correct), required: true },
                        ...(modeIsLRV ? [{ label: 'Shared corridor', value: formatReviewValue(data.shared_corridor) }] : []),
                        { label: 'Equipment malfunction', value: formatReviewValue(data.equipment_malfunction) },
                        { label: 'Damage to other property', value: formatReviewValue(data.damage_to_property) },
                        { label: 'Grade crossing or intersection', value: formatReviewValue(data.program_manager_at_grade_crossing_or_intersection) },
                        { label: 'Life-safety evacuation', value: formatReviewValue(data.program_manager_life_safety_evacuation) },
                        { label: 'Employee contacted PM', value: formatReviewValue(data.employee_contacted_program_manager) },
                        ...(data.employee_contacted_program_manager === true
                          ? [{ label: 'Date PM contacted', value: formatReviewValue(data.employee_contacted_program_manager_date) }]
                          : []),
                        { label: 'Field Supervisor statement', value: formatReviewValue(data.supervisor_event_description), required: true, wide: true },
                        { label: 'Police statement', value: formatReviewValue(data.police_statement), wide: true },
                        { label: 'Action taken', value: formatReviewValue(data.action_taken), wide: true },
                      ]
                    )}

                    {renderPmReviewGroup(
                      'Event Analysis',
                      'Contributing factors, collision context, derailment, damage, and tow.',
                      2,
                      [
                        { label: 'Contributing factors', value: contributingFactorsList.length > 0 ? contributingFactorsList.join(', ') : 'Not entered', wide: true },
                        ...(data.program_manager_primary_contributing_factor ? [{ label: 'Primary factor', value: data.program_manager_primary_contributing_factor }] : []),
                        ...(isEventCollision ? [
                          { label: 'Collisions with', value: formatReviewValue(data.program_manager_collision_with) },
                          { label: 'DART vehicle collision type', value: formatReviewValue(data.program_manager_other_collision_type) },
                          { label: 'DART vehicle action', value: formatReviewValue(data.program_manager_dart_action) },
                          { label: 'DART vehicle point of impact', value: formatReviewValue(data.program_manager_dart_collision_type) },
                        ] : []),
                        ...(derailmentApplies ? [
                          { label: 'Derail configuration', value: formatReviewValue(data.program_manager_derail_configuration) },
                          ...(modeIsLRV ? [{ label: 'Cars derailed', value: formatReviewValue(data.program_manager_cars_derailed_count) }] : []),
                        ] : []),
                        ...(modeIsBus ? [{ label: 'Estimated damages', value: formatReviewValue(data.program_manager_estimated_total_damages) }] : []),
                        { label: 'Tow-away', value: formatReviewValue(data.program_manager_tow_away) },
                        ...(data.program_manager_tow_away ? [{ label: 'Vehicle towed', value: formatReviewValue(data.program_manager_tow_away_vehicle) }] : []),
                      ]
                    )}

                    {renderPmReviewGroup(
                      'People and Impact',
                      'Fatalities and injuries by employee, passenger, pedestrian, and other-vehicle occupant.',
                      3,
                      [
                        { label: 'Any fatalities', value: pmTotalFatalities > 0 ? 'Yes' : 'No' },
                        ...(pmTotalFatalities > 0 ? [
                          { label: 'Employee fatalities', value: formatReviewValue(pmEmpFatCount) },
                          { label: 'Passenger fatalities', value: formatReviewValue(pmPaxFatCount) },
                          { label: 'Pedestrian fatalities', value: formatReviewValue(pmPedFatCount) },
                          { label: 'Other-vehicle occupant fatalities', value: formatReviewValue(data.program_manager_other_vehicle_fatality_count) },
                        ] : []),
                        { label: 'Any injuries', value: pmTotalInjured > 0 ? 'Yes' : 'No' },
                        ...(pmTotalInjured > 0 ? [
                          { label: 'Employees injured', value: formatReviewValue(pmEmpInjCount) },
                          { label: 'Passengers injured', value: formatReviewValue(pmPaxInjCount) },
                          { label: 'Pedestrians injured', value: formatReviewValue(pmPedInjCount) },
                          { label: 'Other-vehicle occupants injured', value: formatReviewValue(data.program_manager_other_vehicle_injury_count) },
                        ] : []),
                      ]
                    )}

                    {renderPmReviewGroup(
                      'Classification',
                      'Your final decision, date, and justification.',
                      4,
                      [
                        { label: 'Decision', value: formatReviewValue(data.program_manager_classification_value), required: true },
                        { label: 'Date classified', value: formatReviewValue(data.program_manager_classification_date), required: true },
                        { label: 'Program manager', value: data.program_manager_classified_by_name || 'Auto-filled on submit' },
                        { label: 'Justification', value: formatReviewValue(data.program_manager_classification_justification), required: true, wide: true },
                      ]
                    )}
                  </div>

                  {/* Accuracy confirmation */}
                  <div className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50/50 p-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={pmReviewConfirmed}
                        onChange={(e) => setPmReviewConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#00205B] focus:ring-[#FFCD00]"
                      />
                      <div className="text-xs leading-relaxed text-slate-700 font-['Poppins']">
                        <span className="font-semibold text-slate-900">
                          I have reviewed the classification and supporting case information and confirm that it is accurate to the best of my knowledge.
                        </span>
                        <span className="mt-1 block text-slate-600">
                          The report will remain assigned to you until you choose and confirm a workflow action on the next screen. After that, no changes can be made from this screen.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Review footer: Back / Save / Continue to next action */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => setPmReviewStep(4)}
                  className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                >
                  ← Back to Classify
                </button>
                <div className="flex items-center gap-3">
                  <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
                  <GlassButton
                    variant="primary"
                    disabled={pmMissingFields.length > 0 || !pmReviewConfirmed}
                    onClick={() => setPendingActionsRole('programManager')}
                  >
                    Continue to next action
                  </GlassButton>
                </div>
              </div>
              </>)}

              {isPmStep5 && pmInActionsMode && pmReviewEnabled && pmSupervisorSection && (
                pmConfirmedAction ? (
                  <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white p-6 md:p-8 shadow-[0_2px_12px_-2px_rgba(16,185,129,0.10)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35)]">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-[#00205B] font-['Poppins']">{pmConfirmedAction.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700 font-['Poppins']">{pmConfirmedAction.description}</p>
                        {submittedEventId && (
                          <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-white/80 px-3 py-1.5">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-900 font-['Poppins']">Case ID {submittedEventId}</span>
                          </div>
                        )}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {onBackToHome && (
                            <GlassButton variant="primary" onClick={onBackToHome}>Back to home</GlassButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                <ActionSelectionScreen
                  title="Choose next action"
                  description="Select what should happen next. Your choice will update the workflow status and assignment."
                  actions={buildSpmActions({
                    reassignOptions: Object.values(EMPLOYEE_DB).map((e) => ({
                      value: e.badge,
                      label: e.name,
                      description: `${e.division_work} · Badge ${e.badge}`,
                    })),
                    canApprove: pmMissingFields.length === 0,
                    approveDisabledReason:
                      pmMissingFields.length === 0
                        ? undefined
                        : 'Complete the required report fields before you can approve.',
                    caseIsOnHoldPendingOperator: Boolean(data.pm_on_hold),
                  })}
                  onConfirm={(actionId, payload) => {
                    // TODO: swap these for workflow engine calls when the API lands.
                    // For each action we (a) fire the existing handler so the workflow-state
                    // stub updates, and (b) surface an in-page success card so the SPM knows
                    // the transition happened. The card is what shows next — no navigation.
                    let confirmationTitle = 'Action confirmed';
                    let confirmationDescription = 'The next step will be handled by the workflow engine.';
                    switch (actionId) {
                      case 'approve':
                        pmOnApproveAndClose?.(payload.comment ?? '');
                        confirmationTitle = 'Report closed';
                        confirmationDescription = 'This accident report has been reviewed and closed. No further assignment will be created.';
                        break;
                      case 'rework':
                        pmOnReturn?.(payload.comment ?? '');
                        confirmationTitle = 'Sent for rework';
                        confirmationDescription = 'The report has been returned to the Field Supervisor for corrections. You will be notified when it comes back.';
                        break;
                      case 'pending-operator-input':
                        pmOnHold?.(payload.comment ?? '');
                        confirmationTitle = 'On hold pending operator input';
                        confirmationDescription = 'The report is on hold in your queue while operator information is pending. Re-open the case when the operator is ready.';
                        break;
                      case 'needs-operator-input':
                        onUpdate({ pm_on_hold: false });
                        // eslint-disable-next-line no-console
                        console.info('[stub] Needs Operator Input — push to operator queue', payload);
                        confirmationTitle = 'Sent to Operator';
                        confirmationDescription = 'The report has been assigned to the Operator to complete their section. You will be notified when they submit.';
                        break;
                      case 'reassign':
                        if (payload.toBadge && payload.toName) {
                          pmOnReassign?.({
                            toBadge: payload.toBadge,
                            toName: payload.toName,
                            note: payload.comment ?? '',
                          });
                        }
                        confirmationTitle = 'Report reassigned';
                        confirmationDescription = payload.toName
                          ? `The report has been reassigned to ${payload.toName}. They have been notified.`
                          : 'The report has been reassigned. The new owner has been notified.';
                        break;
                      case 'cancel':
                        pmOnReject?.(payload.comment ?? '');
                        confirmationTitle = 'Report cancelled';
                        confirmationDescription = 'This accident report has been cancelled. It has been closed and no further action will be taken.';
                        break;
                    }
                    setPmConfirmedAction({ actionId, title: confirmationTitle, description: confirmationDescription });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                )
              )}

              {/* Step navigation footer — Back / Continue between PM steps */}
              {isProgramManagerReview && pmReviewStep < programManagerSectionStepCount && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  {pmReviewStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setPmReviewStep(pmReviewStep - 1)}
                      className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                    >
                      ← Back to {pmReviewStep === 2 ? 'Investigation Basics' : pmReviewStep === 3 ? 'Event Analysis' : pmReviewStep === 4 ? 'People and Impact' : 'Classify'}
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-3">
                    <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
                    <GlassButton variant="primary" onClick={() => {
                      const stepMissing = pmMissingFields.filter((m) => m.step === pmReviewStep);
                      if (pmReviewStep === 1 && stepMissing.length > 0) {
                        setPmStep1Attempted(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }
                      if (pmReviewStep === 4 && stepMissing.length > 0) {
                        setPmClassifyAttempted(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }
                      setPmReviewStep(pmReviewStep + 1);
                    }}>
                      Continue to {pmReviewStep === 1 ? 'Event Analysis' : pmReviewStep === 2 ? 'People and Impact' : pmReviewStep === 3 ? 'Classify' : 'Review'}
                    </GlassButton>
                  </div>
                </div>
              )}

              {/* Actions screen owns its own Back / Confirm footer — no duplicate wizard nav here. */}

            </div>
          </div>
          );
        })()}

        {/* Confirmation — hidden for Program Manager (their Approve action already requires a note),
            and hidden for the Operator once they've moved into the actions screen. */}
        {(!isSupervisorReview || (supervisorReviewStep === 3 && !fsInActionsMode)) && !isProgramManagerReview && !(isOperatorFinalReview && operatorInActionsMode) && (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmationChecked}
              onChange={(e) => handleConfirmationChange(e.target.checked)}
              className="mt-1 w-5 h-5 text-[#0078AE] rounded focus:ring-2 focus:ring-[#FFCD00] cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm text-slate-900 font-medium font-['Poppins']">
                {isSupervisorReview
                  ? 'I confirm that the supervisor review section is complete and ready for program manager review'
                  : 'I confirm that my section is accurate to the best of my knowledge'}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-['Poppins']">
                {isSupervisorReview
                  ? 'This Field Supervisor section will be available in the shared case for classification.'
                  : 'This information joins the shared case and may be used for safety analysis and reporting'}
              </div>
            </div>
          </label>
        </div>
        )}
      </div>

      {/* Smart Check Banner — hidden for go-live. Flip SHOW_SMART_CHECK to true when the feature is ready. */}
      {false && (!isSupervisorReview || supervisorReviewStep === 3) && !isProgramManagerReview && (
      <div className="mt-6">
        <SmartCheckReviewBanner 
          state={smartCheckState}
          issues={smartCheckIssues}
          onRunCheck={handleRunSmartCheck}
          onIssueClick={(issue) => {
            if (isSupervisorReview && issue.section === 'Step 1') {
              setSupervisorReviewStep(1);
            }
          }}
        />
      </div>
      )}

      {/* Footer Actions — hidden for Program Manager (their step-nav footer inside the PM card owns Back/Save/Continue).
          Also hidden when Field Supervisor or Operator is in Actions mode — the ActionSelectionScreen owns its own footer. */}
      {(!isSupervisorReview || (supervisorReviewStep === 3 && !fsInActionsMode)) && !isProgramManagerReview && !(isOperatorFinalReview && operatorInActionsMode) && (
      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-8 pt-6 border-t border-slate-200">
        {isSupervisorReview && supervisorReviewStep === 3 ? (
          <button
            type="button"
            onClick={() => setSupervisorReviewStep(2)}
            className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
          >
            Back to injuries
          </button>
        ) : showBackButton ? (
          <button
            onClick={onBack}
            className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>
            Save as draft
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={() => {
              if (isSupervisorReview && supervisorReviewStep === 3) {
                setPendingActionsRole('supervisor');
                return;
              }
              if (isOperatorFinalReview) {
                setPendingActionsRole('operator');
                return;
              }
              onSubmit();
            }}
            disabled={submitDisabled}
          >
            {(isSupervisorReview && supervisorReviewStep === 3) || isOperatorFinalReview ? 'Continue to next action' : submitLabel}
          </GlassButton>
        </div>
      </div>
      )}

      {/* Submission Success Inline */}
      {showSuccessState && submittedEventId && onBackToHome && (
        <div className="mt-8">
          <SubmissionSuccessInline
            eventId={submittedEventId}
            data={data}
            onBackToHome={onBackToHome}
            onViewReport={() => console.log('View case')}
          />
        </div>
      )}

      {/* Review → Actions confirmation. Once the user continues they can no longer
          edit their section, so warn them explicitly before making the switch. */}
      {pendingActionsRole && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="continue-to-actions-title"
          aria-describedby="continue-to-actions-description"
        >
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_-24px_rgba(0,32,91,0.35)]">
            <div className="px-6 pt-6 pb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00205B]/8 text-[#00205B]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 id="continue-to-actions-title" className="mt-4 text-xl font-semibold text-[#00205B] font-['Poppins']">
                Finalize this section?
              </h2>
              <p className="mt-1.5 text-sm font-medium text-slate-800 font-['Poppins']">
                You will not be able to return and edit it after continuing.
              </p>
            </div>

            <div className="px-6 pt-3 pb-6">
              <p id="continue-to-actions-description" className="text-sm leading-6 text-slate-600 font-['Poppins']">
                Continuing will finalize your entries and create the report for workflow routing. Review your information now before moving to the next action.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPendingActionsRole(null)}
                  className="dart-press inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#00205B] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00205B]/30 font-['Poppins']"
                >
                  Continue editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const role = pendingActionsRole;
                    setPendingActionsRole(null);
                    if (role === 'operator') setOperatorInActionsMode(true);
                    else if (role === 'supervisor') setFsInActionsMode(true);
                    else if (role === 'programManager') setPmInActionsMode(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="dart-press inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#00205B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003478] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00205B]/40 font-['Poppins']"
                >
                  Finalize and continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StepContainer>
  );
}