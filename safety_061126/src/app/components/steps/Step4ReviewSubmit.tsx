import { useEffect, useState, type ReactNode } from 'react';
import { Bus, Car, Download, Edit, FileText, Train, TramFront, Truck, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { SmartCheckReviewBanner } from '../SmartCheckReviewBanner';
import { SubmissionSuccessInline } from '../SubmissionSuccessInline';
import { OperatorReportDrawer } from './sections/OperatorReportDrawer';
import { YesNoToggle } from '../form/YesNoToggle';
import { SearchableCombobox, type ComboboxOption } from '../SearchableCombobox';
import { CustomSelect } from '../CustomSelect';
import { DatePickerInput } from '../DatePickerInput';
import { TimePickerInput } from '../TimePickerInput';
import type { AccidentReportData, SupervisorDemographicRecord, SupervisorOtherVehicleRecord } from '../../types/accident-report';
import { useUserRole, type UserRole } from '../../context/UserRoleContext';
import { EMPLOYEE_DB } from '../../data/employeeDatabase';
import { type WorkflowSectionKey, type WorkflowSectionStatus, type WorkflowSections } from '../../types/workflow-report';

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

function YesNoButtons({ value, onChange }: { value?: boolean; onChange: (value: boolean) => void }) {
  return <YesNoToggle value={value} onChange={onChange} />;
}

function RevealPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      {...REVEAL_MOTION}
      className={`rounded-xl border border-[#D8E3EF] bg-[#F8FBFE] p-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.45)] ${className}`}
    >
      <div className="border-l-4 border-[#0072B8] pl-4">
        {children}
      </div>
    </motion.div>
  );
}

function DecisionGroup({ label, value, onChange, children }: { label: string; value?: boolean; onChange: (value: boolean) => void; children?: ReactNode }) {
  const answeredClass = value === true
    ? 'border-[#99C8E8] bg-[#F8FBFE] shadow-[0_12px_32px_-28px_rgba(15,23,42,0.7)]'
    : value === false
      ? 'border-slate-300 bg-white shadow-sm'
      : 'border-slate-200 bg-slate-50/70';

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${answeredClass}`}>
      <div>
        <div className={FIELD_LABEL_CLASS}>{label}</div>
        <div className="mt-2">
          <YesNoButtons value={value} onChange={onChange} />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {value && children && (
          <RevealPanel className="mt-4">
            {children}
          </RevealPanel>
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
  title = 'Review and Submit',
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
}: Step4Props) {
  const { roleConfig } = useUserRole();
  const [isDragging, setIsDragging] = useState(false);
  const [smartCheckState, setSmartCheckState] = useState<'default' | 'issues' | 'clear'>('default');
  const [smartCheckIssues, setSmartCheckIssues] = useState<Array<{ id: string; message: string }>>([]);
  const [isOperatorReportOpen, setIsOperatorReportOpen] = useState(false);
  const [localSupervisorReviewStep, setLocalSupervisorReviewStep] = useState(1);
  const attachments = data.attachments || [];
  const isInitiationStage = workflowStage === 'initiation';
  const isSupervisorReview = activeSectionKey === 'supervisor';
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
  const isSectionAlreadySubmitted = activeSectionStatus === 'submitted' || activeSectionStatus === 'accepted';
  const showInlineReferenceSummaries = !isSupervisorReview && !isProgramManagerReview;
  const showRoleAttachments = isSupervisorReview || isProgramManagerReview;
  const supervisorWorkdayRecord = roleConfig.role === 'Supervisor' ? EMPLOYEE_DB[roleConfig.badge] : undefined;
  const supervisorVehicleType = data.supervisor_dart_vehicle_type || '';
  const hasSupervisorVehicleType = Boolean(supervisorVehicleType);
  const supervisorVehicleIsHiRailOrNrv = supervisorVehicleType === 'Hi-Rail' || supervisorVehicleType === 'Non-Revenue Vehicle' || supervisorVehicleType === 'NRV';
  const supervisorVehicleIsRailMode = supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar' || supervisorVehicleType === 'Hi-Rail';
  const supervisorLocationUsesRail = supervisorVehicleIsRailMode;
  const supervisorLocationUsesStreet = hasSupervisorVehicleType && !supervisorLocationUsesRail;
  const showSupervisorRailStation = railLocationShowsStation(data.supervisor_location_category || '');
  const showSupervisorRailGrade = railLocationShowsGrade(data.supervisor_location_category || '');
  const showSupervisorRailTunnel = railLocationShowsTunnel(data.supervisor_location_category || '');
  const showSupervisorRevenueQuestion = hasSupervisorVehicleType && !supervisorVehicleIsHiRailOrNrv;
  const showSupervisorRevenueFields = showSupervisorRevenueQuestion && data.supervisor_revenue_service === true;
  const showSupervisorRailLine = showSupervisorRevenueFields && (supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar');
  const showSupervisorDartTowCount = data.supervisor_dart_vehicle_damaged === true && data.supervisor_damage_requires_tow === true && (data.supervisor_damage_count || 0) > 0;
  const showSupervisorOtherVehicleTowCount = (data.supervisor_other_vehicle_damage_count || 0) > 0;
  const passengerFatalityRecords = resizeDemographicRecords(data.supervisor_passenger_fatality_details, data.supervisor_passenger_fatality_count);
  const passengerInjuryRecords = resizeDemographicRecords(data.supervisor_passenger_injury_details, data.supervisor_passenger_injury_count);
  const pedestrianFatalityRecords = resizeDemographicRecords(data.supervisor_pedestrian_fatality_details, data.supervisor_pedestrian_fatality_count);
  const pedestrianInjuryRecords = resizeDemographicRecords(data.supervisor_pedestrian_injury_details, data.supervisor_pedestrian_injury_count);
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
    value: record.fleetType,
    label: record.fleetType,
    description: `${record.trainNumber} • Car ${record.carNumber} • ${record.source}`,
  }));
  const confirmationChecked = isSupervisorReview
    ? Boolean(data.supervisor_confirmation_checked)
    : isProgramManagerReview
    ? Boolean(data.program_manager_confirmation_checked)
    : Boolean(data.confirmation_checked);
  const supervisorRequiredReviewItems = [
    { id: 'supervisor-incident-date', label: 'Incident date', step: 1, missing: !data.supervisor_incident_date },
    { id: 'supervisor-incident-time', label: 'Incident time', step: 1, missing: !data.supervisor_incident_time },
    { id: 'supervisor-arrival-date', label: 'Supervisor arrival date', step: 1, missing: !data.supervisor_arrival_date },
    { id: 'supervisor-arrival-time', label: 'Supervisor arrival time', step: 1, missing: !data.supervisor_arrival_time },
    { id: 'supervisor-vehicle-mode', label: 'Vehicle mode', step: 1, missing: !data.supervisor_dart_vehicle_type },
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
    { id: 'supervisor-event-description', label: 'Supervisor description of safety event', step: 1, missing: !data.supervisor_event_description },
  ].filter((item) => item.missing);
  const supervisorDetailsReviewFields = [
    { label: 'Incident date', value: formatReviewValue(data.supervisor_incident_date), required: true },
    { label: 'Incident time', value: formatReviewValue(data.supervisor_incident_time), required: true },
    { label: 'Supervisor arrival date', value: formatReviewValue(data.supervisor_arrival_date), required: true },
    { label: 'Supervisor arrival time', value: formatReviewValue(data.supervisor_arrival_time), required: true },
    { label: 'Vehicle mode', value: formatReviewValue(data.supervisor_dart_vehicle_type), required: true },
    ...(hasSupervisorVehicleType ? [
      { label: supervisorVehicleType === 'Bus' ? 'Bus vehicle number' : supervisorVehicleType === 'Streetcar' ? 'Streetcar number' : supervisorVehicleType === 'Light Rail Vehicle' ? 'Train number' : 'Vehicle number', value: formatReviewValue(data.supervisor_vehicle_number), required: true },
      { label: supervisorVehicleType === 'Bus' ? 'Fleet type' : 'Fleet or asset type', value: formatReviewValue(data.supervisor_fleet), required: true },
    ] : []),
    ...(supervisorVehicleType === 'Bus' ? [
      { label: 'Trip ID', value: formatReviewValue(data.supervisor_trip_id) },
      { label: 'Employee pull-out date', value: formatReviewValue(data.supervisor_employee_pullout_date) },
      { label: 'Employee pull-out time', value: formatReviewValue(data.supervisor_employee_pullout_time) },
    ] : []),
    ...(supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar' ? [
      { label: 'LRV fleet type', value: formatReviewValue(data.supervisor_lrv_fleet_type) },
      { label: 'Car number involved in event', value: formatReviewValue(data.supervisor_car_number) },
      { label: 'Train pull-out date', value: formatReviewValue(data.supervisor_train_pullout_date) },
      { label: 'Train pull-out time', value: formatReviewValue(data.supervisor_train_pullout_time) },
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
    { label: 'Supervisor description', value: formatReviewValue(data.supervisor_event_description), required: true, wide: true },
    ...(supervisorVehicleIsRailMode ? [
      { label: 'Derailment confirmed', value: formatReviewValue(data.supervisor_derailment_confirmed) },
      ...(data.supervisor_derailment_confirmed ? [{ label: 'Derailment details', value: formatReviewValue(data.supervisor_derailment_details), wide: true }] : []),
    ] : []),
    { label: 'DART vehicle damaged', value: formatReviewValue(data.supervisor_dart_vehicle_damaged) },
    ...(data.supervisor_dart_vehicle_damaged ? [
      { label: 'DART vehicles damaged', value: formatReviewValue(data.supervisor_damage_count) },
      { label: 'Damage requiring tow', value: formatReviewValue(data.supervisor_damage_requires_tow) },
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
    { label: 'Equipment or property damage description', value: formatReviewValue(data.supervisor_equipment_damage_description), wide: true },
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

  const updateSupervisorVehicleType = (value: string) => {
    const hasVehicleType = Boolean(value);
    const vehicleTypeChanged = value !== supervisorVehicleType;
    const previousUsesRailLocation = supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar' || supervisorVehicleType === 'Hi-Rail';
    const nextUsesRailLocation = value === 'Light Rail Vehicle' || value === 'Streetcar' || value === 'Hi-Rail';
    const locationBranchChanged = vehicleTypeChanged && (!supervisorVehicleType || !value || previousUsesRailLocation !== nextUsesRailLocation);
    const hidesBusFields = value !== 'Bus';
    const hidesRailVehicleFields = value !== 'Light Rail Vehicle' && value !== 'Streetcar';
    const hidesRevenueFields = !hasVehicleType || value === 'Hi-Rail' || value === 'Non-Revenue Vehicle' || value === 'NRV';
    const hidesRailLine = value !== 'Light Rail Vehicle' && value !== 'Streetcar';
    onUpdate({
      supervisor_dart_vehicle_type: value,
      ...(vehicleTypeChanged ? {
        supervisor_vehicle_number: undefined,
        supervisor_fleet: undefined,
        supervisor_trip_id: undefined,
        supervisor_employee_pullout_date: undefined,
        supervisor_employee_pullout_time: undefined,
        supervisor_car_number: undefined,
        supervisor_train_pullout_date: undefined,
        supervisor_train_pullout_time: undefined,
        supervisor_lrv_fleet_type: undefined,
      } : {}),
      ...(locationBranchChanged ? {
        supervisor_street_on: undefined,
        supervisor_cross_street: undefined,
        supervisor_city: undefined,
        supervisor_zip: undefined,
        supervisor_location_category: undefined,
        supervisor_station_applicable: undefined,
        supervisor_grade_crossing_applicable: undefined,
        supervisor_tunnel_location: undefined,
        supervisor_address_of_event: undefined,
      } : {}),
      ...(!hasVehicleType ? {
        supervisor_vehicle_number: undefined,
        supervisor_fleet: undefined,
        supervisor_dart_vehicle_damaged: undefined,
        supervisor_damage_requires_tow: undefined,
        supervisor_damage_count: undefined,
        supervisor_tow_count: undefined,
        supervisor_other_vehicle_damage_count: undefined,
        supervisor_other_vehicle_tow_count: undefined,
        supervisor_scene_diagram_completed: undefined,
        supervisor_scene_photos_taken: undefined,
        supervisor_equipment_damage_description: undefined,
      } : {}),
      ...(hidesBusFields ? {
        supervisor_trip_id: undefined,
        supervisor_employee_pullout_date: undefined,
        supervisor_employee_pullout_time: undefined,
      } : {}),
      ...(hidesRailVehicleFields ? {
        supervisor_car_number: undefined,
        supervisor_train_pullout_date: undefined,
        supervisor_train_pullout_time: undefined,
        supervisor_lrv_fleet_type: undefined,
      } : {}),
      ...(hidesRevenueFields ? {
        supervisor_revenue_service: undefined,
        supervisor_operating_route_number: undefined,
        supervisor_block_number: undefined,
        supervisor_rail_line: undefined,
      } : {}),
      ...(hidesRailLine ? { supervisor_rail_line: undefined } : {}),
      ...(!['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'].includes(value) ? {
        supervisor_derailment_confirmed: undefined,
        supervisor_derailment_details: undefined,
      } : {}),
    });
  };

  const updateSupervisorBusVehicleNumber = (value: string) => {
    const vehicle = BUS_VEHICLE_DB.find(item => item.id === value);
    onUpdate(vehicle
      ? { supervisor_vehicle_number: vehicle.id, supervisor_fleet: vehicle.type, supervisor_trip_id: vehicle.tripId }
      : { supervisor_vehicle_number: value, supervisor_fleet: undefined, supervisor_trip_id: undefined });
  };

  const updateSupervisorRailFleetType = (value: string) => {
    const record = RAIL_FLEET_DB.find(item => item.fleetType === value);
    onUpdate(record
      ? {
          supervisor_lrv_fleet_type: record.fleetType,
          supervisor_fleet: record.fleetType,
          supervisor_vehicle_number: record.trainNumber,
          supervisor_car_number: record.carNumber,
        }
      : {
          supervisor_lrv_fleet_type: value,
          supervisor_fleet: value,
          supervisor_vehicle_number: undefined,
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
    if (data.supervisor_division !== supervisorWorkdayRecord.division) {
      nextIdentity.supervisor_division = supervisorWorkdayRecord.division;
    }

    if (Object.keys(nextIdentity).length > 0) {
      onUpdate(nextIdentity);
    }
  }, [data.supervisor_badge_number, data.supervisor_division, data.supervisor_name, isSupervisorReview, onUpdate, supervisorWorkdayRecord]);

  const renderDemographicRecords = (
    records: SupervisorDemographicRecord[],
    field: 'supervisor_passenger_fatality_details' | 'supervisor_passenger_injury_details' | 'supervisor_pedestrian_fatality_details' | 'supervisor_pedestrian_injury_details',
    title: string,
    includeTransported: boolean
  ) => (
    <div className="space-y-3 md:col-span-2">
      {records.map((record, index) => (
        <div key={`${field}-${index}`} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div className="md:col-span-3 text-xs font-semibold text-slate-700 font-['Poppins']">{title} #{index + 1}</div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Age</div>
            <select value={record.age_group || ''} onChange={(e) => updateSupervisorDemographicRecord(field, records, index, { age_group: e.target.value as SupervisorDemographicRecord['age_group'] })} className={INPUT_CLASS}>
              <option value="">Select age</option>
              {AGE_GROUP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Gender</div>
            <select value={record.gender || ''} onChange={(e) => updateSupervisorDemographicRecord(field, records, index, { gender: e.target.value as SupervisorDemographicRecord['gender'] })} className={INPUT_CLASS}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
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
                  <select value={occupant.age_group || ''} onChange={(e) => updateNestedDemographicRecord('deceased_occupants', deceasedOccupants, occupantIndex, { age_group: e.target.value as SupervisorDemographicRecord['age_group'] })} className={INPUT_CLASS}>
                    <option value="">Select age</option>
                    {AGE_GROUP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Gender</div>
                  <select value={occupant.gender || ''} onChange={(e) => updateNestedDemographicRecord('deceased_occupants', deceasedOccupants, occupantIndex, { gender: e.target.value as SupervisorDemographicRecord['gender'] })} className={INPUT_CLASS}>
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
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
                      <select value={occupant.age_group || ''} onChange={(e) => updateNestedDemographicRecord('injured_occupants', injuredOccupants, occupantIndex, { age_group: e.target.value as SupervisorDemographicRecord['age_group'] })} className={INPUT_CLASS}>
                        <option value="">Select age</option>
                        {AGE_GROUP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Gender</div>
                      <select value={occupant.gender || ''} onChange={(e) => updateNestedDemographicRecord('injured_occupants', injuredOccupants, occupantIndex, { gender: e.target.value as SupervisorDemographicRecord['gender'] })} className={INPUT_CLASS}>
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
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
            <select value={record.type || ''} onChange={(e) => updateSupervisorOtherVehicleRecord(index, { type: e.target.value })} className={INPUT_CLASS}>
              <option value="">Select type</option>
              {otherVehicleTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Other vehicle #{vehicleNumber} action</div>
            <select value={record.action || ''} onChange={(e) => updateSupervisorOtherVehicleRecord(index, { action: e.target.value })} className={INPUT_CLASS}>
              <option value="">Select action</option>
              {OTHER_VEHICLE_ACTION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Other vehicle #{vehicleNumber} point of impact</div>
            <select value={record.point_of_impact || ''} onChange={(e) => updateSupervisorOtherVehicleRecord(index, { point_of_impact: e.target.value })} className={INPUT_CLASS}>
              <option value="">Select point of impact</option>
              {OTHER_VEHICLE_POINT_OF_IMPACT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <div className={FIELD_LABEL_CLASS}>Direction of other vehicle #{vehicleNumber} in relation to DART vehicle</div>
            <select value={record.direction || ''} onChange={(e) => updateSupervisorOtherVehicleRecord(index, { direction: e.target.value })} className={INPUT_CLASS}>
              <option value="">Select direction</option>
              {OTHER_VEHICLE_DIRECTION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div>
          <h5 className="text-sm font-semibold text-[#00205B] font-['Poppins']">{title}</h5>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 font-['Poppins']">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setSupervisorReviewStep(editStep)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const isEmpty = field.value === 'Not entered';
          return (
            <div key={`${title}-${field.label}`} className={`rounded-lg border border-slate-200 bg-white px-4 py-3 ${field.wide ? 'md:col-span-2 xl:col-span-3' : ''}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">
                {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
              </p>
              <p className={`mt-1 text-sm font-medium leading-relaxed font-['Poppins'] ${isEmpty ? 'text-slate-400' : 'text-slate-900'}`}>{field.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleRunSmartCheck = () => {
    const issues: Array<{ id: string; message: string; section?: string }> = isSupervisorReview
      ? supervisorRequiredReviewItems.map((item) => ({
          id: item.id,
          message: `Complete ${item.label.toLowerCase()} before submitting the supervisor section.`,
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
    confirmationChecked &&
    (!isSupervisorReview || (
      supervisorRequiredReviewItems.length === 0
    )) &&
    (!isProgramManagerReview || (
      data.operator_datetime_correct !== undefined &&
      data.employee_contacted_program_manager_date &&
      data.field_supervisor_statement &&
      data.program_manager_classification
    ))
  );

  const submitDisabled = isSectionAlreadySubmitted || (isSupervisorReview || isProgramManagerReview ? !reviewCanSubmit : !canSubmit);
  const stepDescription = description || (isSupervisorReview ? 'Complete supervisor-owned fields and submit to the program manager.' : 'Check your section details, then attach any photos or documents.');

  useEffect(() => {
    if (!isSupervisorReview && supervisorReviewStep !== 1) {
      setSupervisorReviewStep(1);
    }
  }, [isSupervisorReview, supervisorReviewStep]);

  return (
    <StepContainer
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title={title}
      description={stepDescription}
      showStepBadge={showStepBadge}
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

        {/* Vehicle and Location Summary */}
        {showInlineReferenceSummaries && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">Vehicle and location</h4>
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
              <div className="text-xs text-slate-500 mb-1 font-['Poppins']">Any injuries?</div>
              <div className="text-sm text-slate-900 font-['Poppins']">
                {data.any_injuries === true ? 'Yes' : data.any_injuries === false ? 'No' : '—'}
              </div>
            </div>
            {data.any_injuries && data.people && data.people.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2 font-['Poppins']">People involved ({data.people.length})</div>
                <div className="space-y-2">
                  {data.people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm text-slate-900 font-['Poppins']">{person.name}</div>
                        <div className="text-xs text-slate-600 font-['Poppins']">{person.role}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`
                          inline-flex px-2 py-1 rounded-full text-xs font-['Poppins']
                          ${person.injury_level === 'None' ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${person.injury_level === 'Minor' ? 'bg-amber-100 text-amber-700' : ''}
                          ${person.injury_level === 'Serious' ? 'bg-orange-100 text-orange-700' : ''}
                          ${person.injury_level === 'Fatal' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {person.injury_level}
                        </span>
                        {person.transported_to_hospital && (
                          <span className="text-xs text-slate-600 font-['Poppins']">→ {person.hospital_name}</span>
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

        {isSupervisorReview && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsOperatorReportOpen(true)}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
              >
                Open operator report
              </button>
            </div>

            <div className="space-y-6">
              {supervisorReviewStep === 1 && (
              <>
              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Incident basics</h5>
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Incident date <span className="text-red-500">*</span></div>
                    <DatePickerInput value={data.supervisor_incident_date || ''} onChange={(value) => onUpdate({ supervisor_incident_date: value })} />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Incident time <span className="text-red-500">*</span></div>
                    <TimePickerInput value={data.supervisor_incident_time || ''} onChange={(value) => onUpdate({ supervisor_incident_time: value })} />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Supervisor arrival date <span className="text-red-500">*</span></div>
                    <DatePickerInput value={data.supervisor_arrival_date || ''} onChange={(value) => onUpdate({ supervisor_arrival_date: value })} />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Supervisor arrival time <span className="text-red-500">*</span></div>
                    <TimePickerInput value={data.supervisor_arrival_time || ''} onChange={(value) => onUpdate({ supervisor_arrival_time: value })} />
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-[15px] font-semibold text-[#00205B] font-['Poppins'] leading-tight">Vehicle mode</h5>
                <p className="mb-4 mt-1 text-xs text-slate-500 font-['Poppins']">Which DART vehicle mode is involved?</p>
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {DART_VEHICLE_TYPE_OPTIONS.map((mode) => {
                        const Icon = mode.icon;
                        const selected = supervisorVehicleType === mode.value;
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => updateSupervisorVehicleType(mode.value)}
                            className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.16)] ${
                              selected
                                ? 'border-[#00205B] bg-[#00205B]'
                                : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <div
                              className={`p-2.5 rounded-lg transition-colors ${
                                selected ? 'bg-white/15' : 'bg-[#F1F5F9]'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-[#64748B]'}`} />
                            </div>
                            <span className={`text-xs font-semibold font-['Poppins'] ${selected ? 'text-white' : 'text-[#233B57]'}`}>{mode.label}</span>
                            <span className={`text-[10px] font-['Poppins'] ${selected ? 'text-white/80' : 'text-[#5B6B82]'}`}>{mode.sublabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {hasSupervisorVehicleType && (
                      <RevealPanel key={`supervisor-vehicle-${supervisorVehicleType}`} className="md:col-span-2">
                        {supervisorVehicleType === 'Bus' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Bus vehicle number <span className="text-red-500">*</span></div>
                                <SearchableCombobox
                                  options={supervisorBusVehicleOptions}
                                  value={data.supervisor_vehicle_number || ''}
                                  onChange={updateSupervisorBusVehicleNumber}
                                  placeholder="Search vehicle #"
                                  searchPlaceholder="Type vehicle number..."
                                  emptyMessage="No vehicles found"
                                />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Fleet type</div>
                                <input
                                  type="text"
                                  readOnly
                                  value={data.supervisor_fleet || ''}
                                  placeholder="Auto-populated from bus #"
                                  className={`${INPUT_CLASS} bg-white/70 cursor-not-allowed text-slate-500`}
                                />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Trip ID</div>
                                <input
                                  type="text"
                                  readOnly
                                  value={data.supervisor_trip_id || ''}
                                  placeholder="Auto-populated from bus #"
                                  className={`${INPUT_CLASS} bg-white/70 cursor-not-allowed text-slate-500`}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Employee pull-out date</div>
                                <DatePickerInput value={data.supervisor_employee_pullout_date || ''} onChange={(value) => onUpdate({ supervisor_employee_pullout_date: value })} />
                              </div>
                              <div>
                                <div className={FIELD_LABEL_CLASS}>Employee pull-out time</div>
                                <TimePickerInput value={data.supervisor_employee_pullout_time || ''} onChange={(value) => onUpdate({ supervisor_employee_pullout_time: value })} />
                              </div>
                            </div>
                          </div>
                        ) : supervisorVehicleType === 'Light Rail Vehicle' || supervisorVehicleType === 'Streetcar' ? (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <div className={FIELD_LABEL_CLASS}>LRV fleet type <span className="text-red-500">*</span></div>
                              <SearchableCombobox
                                options={supervisorRailFleetOptions}
                                value={data.supervisor_lrv_fleet_type || ''}
                                onChange={updateSupervisorRailFleetType}
                                placeholder="Search fleet type"
                                searchPlaceholder="Type fleet type..."
                                emptyMessage="No linked fleet records found"
                              />
                            </div>
                            <div>
                              <div className={FIELD_LABEL_CLASS}>{supervisorVehicleType === 'Streetcar' ? 'Streetcar number' : 'Train number'}</div>
                              <input
                                type="text"
                                readOnly
                                value={data.supervisor_vehicle_number || ''}
                                placeholder="Auto-populated from fleet type"
                                className={`${INPUT_CLASS} bg-white/70 cursor-not-allowed text-slate-500`}
                              />
                            </div>
                            <div>
                              <div className={FIELD_LABEL_CLASS}>Car number involved in event</div>
                              <input
                                type="text"
                                readOnly
                                value={data.supervisor_car_number || ''}
                                placeholder="Auto-populated from fleet type"
                                className={`${INPUT_CLASS} bg-white/70 cursor-not-allowed text-slate-500`}
                              />
                            </div>
                            <div>
                              <div className={FIELD_LABEL_CLASS}>Train pull-out date</div>
                              <DatePickerInput value={data.supervisor_train_pullout_date || ''} onChange={(value) => onUpdate({ supervisor_train_pullout_date: value })} />
                            </div>
                            <div>
                              <div className={FIELD_LABEL_CLASS}>Train pull-out time</div>
                              <TimePickerInput value={data.supervisor_train_pullout_time || ''} onChange={(value) => onUpdate({ supervisor_train_pullout_time: value })} />
                            </div>
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
                      </RevealPanel>
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
                <div>
                  <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Location details</h5>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                    {supervisorLocationUsesStreet && (
                      <>
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
                      </>
                    )}
                    {supervisorLocationUsesRail && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Supervisor description</h5>
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <div className={FIELD_LABEL_CLASS}>Supervisor Description of safety event</div>
                    <textarea rows={4} value={data.supervisor_event_description || ''} onChange={(e) => onUpdate({ supervisor_event_description: e.target.value })} placeholder="Add supervisor investigation notes" className={TEXTAREA_CLASS} />
                  </div>
                </div>
              </div>

              {hasSupervisorVehicleType && (
              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Derailment, damage, and tow</h5>
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                  {supervisorVehicleIsRailMode && (
                    <div className="md:col-span-2">
                      <DecisionGroup
                        label="Did this collision involve a derailment?"
                        value={data.supervisor_derailment_confirmed}
                        onChange={(value) => onUpdate({ supervisor_derailment_confirmed: value, ...(!value ? { supervisor_derailment_details: undefined } : {}) })}
                      >
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Derailment details</div>
                          <textarea rows={3} value={data.supervisor_derailment_details || ''} onChange={(e) => onUpdate({ supervisor_derailment_details: e.target.value })} placeholder="Track, consist, equipment, and scene details" className={TEXTAREA_CLASS} />
                        </div>
                      </DecisionGroup>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <DecisionGroup
                      label="Was the DART vehicle damaged?"
                      value={data.supervisor_dart_vehicle_damaged}
                      onChange={(value) => onUpdate({
                        supervisor_dart_vehicle_damaged: value,
                        ...(!value ? { supervisor_damage_requires_tow: undefined, supervisor_damage_count: undefined, supervisor_tow_count: undefined } : {}),
                      })}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Number of DART vehicles damaged?</div>
                          <input type="number" min={0} value={data.supervisor_damage_count ?? ''} onChange={(e) => {
                            const count = parseOptionalCount(e.target.value);
                            onUpdate({ supervisor_damage_count: count, ...((count || 0) === 0 ? { supervisor_tow_count: undefined } : {}) });
                          }} className={COMPACT_INPUT_CLASS} />
                        </div>
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Was there any damage to DART vehicle requiring tow?</div>
                          <YesNoButtons value={data.supervisor_damage_requires_tow} onChange={(value) => onUpdate({ supervisor_damage_requires_tow: value, ...(!value ? { supervisor_tow_count: undefined } : {}) })} />
                        </div>
                        <AnimatePresence initial={false}>
                          {showSupervisorDartTowCount && (
                            <motion.div {...REVEAL_MOTION} key="dart-tow-count" className="md:col-span-2">
                              <div className={FIELD_LABEL_CLASS}>Number of DART vehicles towed?</div>
                              <input type="number" min={0} value={data.supervisor_tow_count ?? ''} onChange={(e) => updateSupervisorCount('supervisor_tow_count', e.target.value)} className={COMPACT_INPUT_CLASS} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </DecisionGroup>
                  </div>
                  <div className="md:col-span-2">
                    <DecisionGroup
                      label="Were other vehicles involved?"
                      value={data.supervisor_other_vehicles_involved}
                      onChange={(value) => onUpdate({
                        supervisor_other_vehicles_involved: value,
                        ...(!value ? {
                          supervisor_other_vehicle_count: undefined,
                          supervisor_other_vehicle_records: [],
                          supervisor_collision_between_dart_vehicles: undefined,
                          supervisor_other_vehicle_damage_count: undefined,
                          supervisor_other_vehicle_tow_count: undefined,
                        } : {}),
                      })}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className={FIELD_LABEL_CLASS}>How many other vehicles were involved?</div>
                          <input type="number" min={1} value={data.supervisor_other_vehicle_count ?? ''} onChange={(e) => {
                            const count = parseOptionalCount(e.target.value);
                            onUpdate({ supervisor_other_vehicle_count: count, supervisor_other_vehicle_records: resizeOtherVehicleRecords(data.supervisor_other_vehicle_records, count) });
                          }} className={COMPACT_INPUT_CLASS} />
                        </div>
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Was this a collision between DART vehicles?</div>
                          <YesNoButtons value={data.supervisor_collision_between_dart_vehicles} onChange={(value) => onUpdate({ supervisor_collision_between_dart_vehicles: value })} />
                        </div>
                        <div>
                          <div className={FIELD_LABEL_CLASS}>Number of Other vehicles damaged?</div>
                          <input type="number" min={0} value={data.supervisor_other_vehicle_damage_count ?? ''} onChange={(e) => {
                            const count = parseOptionalCount(e.target.value);
                            onUpdate({ supervisor_other_vehicle_damage_count: count, ...((count || 0) === 0 ? { supervisor_other_vehicle_tow_count: undefined } : {}) });
                          }} className={COMPACT_INPUT_CLASS} />
                        </div>
                        <AnimatePresence initial={false}>
                          {showSupervisorOtherVehicleTowCount && (
                            <motion.div {...REVEAL_MOTION} key="other-vehicle-tow-count">
                              <div className={FIELD_LABEL_CLASS}>Number of Other vehicles towed?</div>
                              <input type="number" min={0} value={data.supervisor_other_vehicle_tow_count ?? ''} onChange={(e) => updateSupervisorCount('supervisor_other_vehicle_tow_count', e.target.value)} className={COMPACT_INPUT_CLASS} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </DecisionGroup>
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Scene diagram completed?</div>
                    <YesNoButtons value={data.supervisor_scene_diagram_completed} onChange={(value) => onUpdate({ supervisor_scene_diagram_completed: value })} />
                  </div>
                  <div>
                    <div className={FIELD_LABEL_CLASS}>Scene photos taken?</div>
                    <YesNoButtons value={data.supervisor_scene_photos_taken} onChange={(value) => onUpdate({ supervisor_scene_photos_taken: value })} />
                  </div>
                  <div className="md:col-span-2">
                    <div className={FIELD_LABEL_CLASS}>Equipment or property damage description</div>
                    <textarea rows={3} value={data.supervisor_equipment_damage_description || ''} onChange={(e) => onUpdate({ supervisor_equipment_damage_description: e.target.value })} placeholder="Describe visible damage, disabled equipment, and property impact" className={TEXTAREA_CLASS} />
                  </div>
                </div>
              </div>
              )}

              </>
              )}

              {supervisorReviewStep === 2 && (
              <>
              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">DART Employee Injury Section</h5>
                <div className="space-y-4">
                  <DecisionGroup
                    label="Were there any employee fatalities?"
                    value={data.supervisor_dart_employee_fatalities}
                    onChange={(value) => onUpdate({
                      supervisor_dart_employee_fatalities: value,
                      ...(!value ? { supervisor_dart_employee_fatality_count: undefined } : {}),
                    })}
                  >
                    <div>
                      <div className={FIELD_LABEL_CLASS}>Number of employee fatalities</div>
                      <input type="number" min={1} value={data.supervisor_dart_employee_fatality_count ?? ''} onChange={(e) => updateSupervisorCount('supervisor_dart_employee_fatality_count', e.target.value)} className={COMPACT_INPUT_CLASS} />
                    </div>
                  </DecisionGroup>

                  <DecisionGroup
                    label="Were there any injuries to DART employees?"
                    value={data.supervisor_dart_employee_injuries}
                    onChange={(value) => onUpdate({
                      supervisor_dart_employee_injuries: value,
                      ...(!value ? { supervisor_dart_employee_injury_count: undefined, supervisor_dart_employee_hospital_transport_count: undefined } : {}),
                    })}
                  >
                    <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Number of DART employees injured</div>
                        <input type="number" min={1} value={data.supervisor_dart_employee_injury_count ?? ''} onChange={(e) => updateSupervisorCount('supervisor_dart_employee_injury_count', e.target.value)} className={COMPACT_INPUT_CLASS} />
                      </div>
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Number of DART employees transported to the hospital</div>
                        <input type="number" min={0} value={data.supervisor_dart_employee_hospital_transport_count ?? ''} onChange={(e) => updateSupervisorCount('supervisor_dart_employee_hospital_transport_count', e.target.value)} className={COMPACT_INPUT_CLASS} />
                      </div>
                    </div>
                  </DecisionGroup>
                </div>
              </div>

              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Passenger Injury Section</h5>
                <div className="space-y-4">
                  <DecisionGroup
                    label="Were there any passenger fatalities?"
                    value={data.supervisor_passenger_fatalities}
                    onChange={(value) => onUpdate({
                      supervisor_passenger_fatalities: value,
                      ...(!value ? { supervisor_passenger_fatality_count: undefined, supervisor_passenger_fatality_details: [] } : {}),
                    })}
                  >
                    <div className="space-y-4">
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Number of passenger fatalities</div>
                        <input type="number" min={1} value={data.supervisor_passenger_fatality_count ?? ''} onChange={(e) => {
                          const count = parseOptionalCount(e.target.value);
                          onUpdate({ supervisor_passenger_fatality_count: count, supervisor_passenger_fatality_details: resizeDemographicRecords(data.supervisor_passenger_fatality_details, count) });
                        }} className={COMPACT_INPUT_CLASS} />
                      </div>
                      {passengerFatalityRecords.length > 0 && renderDemographicRecords(passengerFatalityRecords, 'supervisor_passenger_fatality_details', 'Deceased passenger', false)}
                    </div>
                  </DecisionGroup>

                  <DecisionGroup
                    label="Were there injuries to passenger(s) on board?"
                    value={data.supervisor_passenger_injuries}
                    onChange={(value) => onUpdate({
                      supervisor_passenger_injuries: value,
                      ...(!value ? { supervisor_passenger_injury_count: undefined, supervisor_passenger_injury_details: [] } : {}),
                    })}
                  >
                    <div className="space-y-4">
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Number of passenger(s) injured on DART vehicle</div>
                        <input type="number" min={1} value={data.supervisor_passenger_injury_count ?? ''} onChange={(e) => {
                          const count = parseOptionalCount(e.target.value);
                          onUpdate({ supervisor_passenger_injury_count: count, supervisor_passenger_injury_details: resizeDemographicRecords(data.supervisor_passenger_injury_details, count) });
                        }} className={COMPACT_INPUT_CLASS} />
                      </div>
                      {passengerInjuryRecords.length > 0 && renderDemographicRecords(passengerInjuryRecords, 'supervisor_passenger_injury_details', 'Injured passenger', true)}
                    </div>
                  </DecisionGroup>
                </div>
              </div>

              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Pedestrian Injury</h5>
                <div className="space-y-4">
                  <DecisionGroup
                    label="Were there any pedestrian fatalities?"
                    value={data.supervisor_pedestrian_fatalities}
                    onChange={(value) => onUpdate({
                      supervisor_pedestrian_fatalities: value,
                      ...(!value ? { supervisor_pedestrian_fatality_count: undefined, supervisor_pedestrian_fatality_details: [] } : {}),
                    })}
                  >
                    <div className="space-y-4">
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Number of pedestrian fatalities</div>
                        <input type="number" min={1} value={data.supervisor_pedestrian_fatality_count ?? ''} onChange={(e) => {
                          const count = parseOptionalCount(e.target.value);
                          onUpdate({ supervisor_pedestrian_fatality_count: count, supervisor_pedestrian_fatality_details: resizeDemographicRecords(data.supervisor_pedestrian_fatality_details, count) });
                        }} className={COMPACT_INPUT_CLASS} />
                      </div>
                      {pedestrianFatalityRecords.length > 0 && renderDemographicRecords(pedestrianFatalityRecords, 'supervisor_pedestrian_fatality_details', 'Deceased pedestrian', false)}
                    </div>
                  </DecisionGroup>

                  <DecisionGroup
                    label="Was there any injury to pedestrian(s)?"
                    value={data.supervisor_pedestrian_injuries}
                    onChange={(value) => onUpdate({
                      supervisor_pedestrian_injuries: value,
                      ...(!value ? { supervisor_pedestrian_injury_count: undefined, supervisor_pedestrian_injury_details: [] } : {}),
                    })}
                  >
                    <div className="space-y-4">
                      <div>
                        <div className={FIELD_LABEL_CLASS}>Number of pedestrian(s) Injured</div>
                        <input type="number" min={1} value={data.supervisor_pedestrian_injury_count ?? ''} onChange={(e) => {
                          const count = parseOptionalCount(e.target.value);
                          onUpdate({ supervisor_pedestrian_injury_count: count, supervisor_pedestrian_injury_details: resizeDemographicRecords(data.supervisor_pedestrian_injury_details, count) });
                        }} className={COMPACT_INPUT_CLASS} />
                      </div>
                      {pedestrianInjuryRecords.length > 0 && renderDemographicRecords(pedestrianInjuryRecords, 'supervisor_pedestrian_injury_details', 'Injured pedestrian', true)}
                    </div>
                  </DecisionGroup>
                </div>
              </div>

              {data.supervisor_other_vehicles_involved && otherVehicleRecords.length > 0 && (
                <div>
                  <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Other Vehicle Occupants Injury</h5>
                  <div className="space-y-5">
                    {otherVehicleRecords.map((record, index) => renderOtherVehicleRecord(record, index))}
                  </div>
                </div>
              )}

              <div>
                <h5 className="mb-4 text-sm font-semibold text-[#00205B] font-['Poppins']">Police Information</h5>
                <DecisionGroup
                  label="Were police called?"
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
                >
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
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
                </DecisionGroup>
              </div>
              </>
              )}

              {supervisorReviewStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <h5 className="text-sm font-semibold text-[#00205B] font-['Poppins']">Review supervisor section</h5>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 font-['Poppins']">
                      Verify the supervisor-owned details below. Use Edit to return to the step that owns the field, then attach support documents before submitting.
                    </p>
                  </div>

                  {renderSupervisorReviewGroup(
                    'Incident Basics',
                    'Incident timing, supervisor arrival, location, vehicle, damage, tow, and scene documentation fields.',
                    1,
                    supervisorDetailsReviewFields
                  )}

                  {renderSupervisorReviewGroup(
                    'Injuries and Police',
                    'Employee, passenger, pedestrian, other vehicle occupant, and police details.',
                    2,
                    supervisorInjuryPoliceReviewFields
                  )}

                  {supervisorRequiredReviewItems.length > 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-amber-900 font-['Poppins']">
                            Submit is blocked by {supervisorRequiredReviewItems.length} required {supervisorRequiredReviewItems.length === 1 ? 'detail' : 'details'}
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-amber-900 font-['Poppins']">
                            {supervisorRequiredReviewItems.map((item) => (
                              <li key={item.id}>• {item.label}</li>
                            ))}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSupervisorReviewStep(1)}
                          className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                        >
                          Go to details
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
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
                  <GlassButton variant="primary" onClick={() => setSupervisorReviewStep(supervisorReviewStep + 1)}>
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

        {isProgramManagerReview && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">Program manager review section</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 font-['Poppins']">Complete the classification and oversight fields required before closing the case.</p>
            </div>
            <div className="p-6 md:p-7 space-y-5">
              <div>
                <div className={FIELD_LABEL_CLASS}>Is the operator date/time correct?</div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onUpdate({ operator_datetime_correct: true })}
                    className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.operator_datetime_correct === true, 'yes')}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ operator_datetime_correct: false })}
                    className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.operator_datetime_correct === false, 'no')}`}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={FIELD_LABEL_CLASS}>Date employee contacted program manager</div>
                  <DatePickerInput value={data.employee_contacted_program_manager_date || ''} onChange={(value) => onUpdate({ employee_contacted_program_manager_date: value })} />
                </div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Employee contact method</div>
                  <input type="text" value={data.employee_contact_method || ''} onChange={(e) => onUpdate({ employee_contact_method: e.target.value })} placeholder="Phone, radio, in person" className={INPUT_CLASS} />
                </div>
              </div>
              <div>
                <div className={FIELD_LABEL_CLASS}>Collision with</div>
                <CustomSelect
                  value={data.program_manager_collision_with || ''}
                  onChange={(value) => onUpdate({ program_manager_collision_with: value })}
                  options={PROGRAM_MANAGER_COLLISION_WITH_OPTIONS}
                  placeholder="Select collision type"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className={FIELD_LABEL_CLASS}>Shared corridor?</div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onUpdate({ shared_corridor: true })}
                      className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.shared_corridor === true, 'yes')}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ shared_corridor: false })}
                      className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.shared_corridor === false, 'no')}`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Equipment malfunction?</div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onUpdate({ equipment_malfunction: true })}
                      className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.equipment_malfunction === true, 'yes')}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ equipment_malfunction: false })}
                      className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.equipment_malfunction === false, 'no')}`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Damage to property?</div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onUpdate({ damage_to_property: true })}
                      className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.damage_to_property === true, 'yes')}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ damage_to_property: false })}
                      className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.damage_to_property === false, 'no')}`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
              {data.damage_to_property && (
                <div>
                  <div className={FIELD_LABEL_CLASS}>Damage to property description</div>
                  <textarea rows={3} value={data.damage_to_property_description || ''} onChange={(e) => onUpdate({ damage_to_property_description: e.target.value })} placeholder="Describe damaged property" className={TEXTAREA_CLASS} />
                </div>
              )}
              <div>
                <div className={FIELD_LABEL_CLASS}>Field supervisor statement</div>
                <textarea rows={4} value={data.field_supervisor_statement || ''} onChange={(e) => onUpdate({ field_supervisor_statement: e.target.value })} placeholder="Paste or summarize the field supervisor statement" className={TEXTAREA_CLASS} />
              </div>
              <div>
                <div className={FIELD_LABEL_CLASS}>Police statement</div>
                <textarea rows={4} value={data.police_statement || ''} onChange={(e) => onUpdate({ police_statement: e.target.value })} placeholder="Add police statement or notes" className={TEXTAREA_CLASS} />
              </div>
              <div>
                <div className={FIELD_LABEL_CLASS}>Action taken</div>
                <textarea rows={3} value={data.action_taken || ''} onChange={(e) => onUpdate({ action_taken: e.target.value })} placeholder="Document immediate actions, coaching, or escalation" className={TEXTAREA_CLASS} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={FIELD_LABEL_CLASS}>Contributing factors</div>
                  <textarea rows={3} value={data.program_manager_contributing_factors || ''} onChange={(e) => onUpdate({ program_manager_contributing_factors: e.target.value })} placeholder="Road, weather, operator, third party, equipment" className={TEXTAREA_CLASS} />
                </div>
                <div>
                  <div className={FIELD_LABEL_CLASS}>Program manager collision type</div>
                  <textarea rows={3} value={data.program_manager_collision_type || ''} onChange={(e) => onUpdate({ program_manager_collision_type: e.target.value })} placeholder="Rear-end, sideswipe, fixed object" className={TEXTAREA_CLASS} />
                </div>
              </div>
              <div>
                <div className={FIELD_LABEL_CLASS}>Program manager classification</div>
                <textarea rows={3} value={data.program_manager_classification || ''} onChange={(e) => onUpdate({ program_manager_classification: e.target.value })} placeholder="Enter final classification decision" className={TEXTAREA_CLASS} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className={FIELD_LABEL_CLASS}>Appeal requested?</div>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => onUpdate({ appeal_requested: true })}
                    className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.appeal_requested === true, 'yes')}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ appeal_requested: false })}
                    className={`px-4 py-2.5 rounded-lg border transition-colors ${binaryChoiceClass(data.appeal_requested === false, 'no')}`}
                  >
                    No
                  </button>
                </div>
                {data.appeal_requested && (
                  <textarea rows={3} value={data.appeal_notes || ''} onChange={(e) => onUpdate({ appeal_notes: e.target.value })} placeholder="Appeal notes" className={TEXTAREA_CLASS} />
                )}
              </div>
            </div>
          </div>
        )}

        {showRoleAttachments && (!isSupervisorReview || supervisorReviewStep === 3) && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-sm text-slate-900 font-medium font-['Poppins']">Support documents</h4>
              <p className="text-xs text-slate-600 mt-1 font-['Poppins']">
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
        )}

        {/* Confirmation */}
        {(!isSupervisorReview || supervisorReviewStep === 3) && (
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
                  : isProgramManagerReview
                  ? 'I confirm that the program manager review and classification are complete'
                  : 'I confirm that my section is accurate to the best of my knowledge'}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-['Poppins']">
                {isSupervisorReview
                  ? 'This supervisor section will be available in the shared case for classification.'
                  : isProgramManagerReview
                  ? 'Closing this case records the final classification and completes the workflow.'
                  : 'This information joins the shared case and may be used for safety analysis and reporting'}
              </div>
            </div>
          </label>
        </div>
        )}
      </div>

      {/* Smart Check Banner */}
      {(!isSupervisorReview || supervisorReviewStep === 3) && (
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

      {/* Footer Actions */}
      {(!isSupervisorReview || supervisorReviewStep === 3) && (
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
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
            onClick={onSubmit}
            disabled={submitDisabled}
          >
            {submitLabel}
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
    </StepContainer>
  );
}