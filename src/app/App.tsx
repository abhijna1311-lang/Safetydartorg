import '../styles/globals.css';
import { useState } from 'react';
import { OperatorHome } from './components/OperatorHome';
import { AccidentReportWizard } from './components/AccidentReportWizard';
import { MyDrafts } from './components/MyDrafts';
import { MySubmissions } from './components/MySubmissions';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import type { WorkflowReport } from './types/workflow-report';
import type { AccidentReportData } from './types/accident-report';
import { EMPLOYEE_DB } from './data/employeeDatabase';
import { DevScenariosDrawer } from '../dev/DevScenariosDrawer';
import type { DevScenario } from '../dev/scenarios';

type View = 'home' | 'new-report' | 'drafts' | 'submissions';

function workdayEmployeeFields(badge: string): Partial<AccidentReportData> {
  const employee = EMPLOYEE_DB[badge];
  if (!employee) {
    return {};
  }

  return {
    employee_badge_number: employee.badge,
    employee_name: employee.name,
    employee_phone: employee.phone,
    employee_gender: employee.gender,
    employee_address: employee.address,
    employee_age: employee.age,
    date_of_hire: employee.hire_date,
    employee_status: employee.status,
    department: employee.department,
    assigned_division: employee.division,
    division_supervisor: employee.division_supervisor,
    division_work: employee.division_work,
    cost_center: employee.cost_center,
    service_years: employee.service_years,
    service_months: employee.service_months,
    service_days: employee.service_days,
    is_student_employee: employee.is_student,
  };
}

const railContributingFactorsQueueReport: WorkflowReport = {
  id: 'AE-2026-1051',
  initiatedBy: 'Supervisor',
  workflowStage: 'program-manager-review',
  overallStatus: 'waiting-on-sections',
  sections: {
    operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'accepted', submittedBy: 'Operator', submittedAt: '2026-08-22T22:45:00.000Z' },
    supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section derailment', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-08-23T00:10:00.000Z' },
    programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
  },
  currentStep: 4,
  createdAt: '2026-08-22T22:20:00.000Z',
  lastSavedAt: '2026-08-23T00:10:00.000Z',
  dueBy: '08/26/2026',
  lastSubmittedBy: 'Supervisor',
  closedAt: null,
  formData: {
    ...workdayEmployeeFields('10002'),
    is_on_behalf: true,
    on_behalf_employee: '10002',
    event_type: 'Derailment',
    mode: 'Light Rail Vehicle',
    operating_dart_vehicle: true,
    incident_date: '2026-08-22',
    incident_time: '22:14',
    description_of_event: 'The lead truck of the leading car derailed at low speed on the yard switch approach. The operator secured the train and notified rail control.',
    train_number: 'T-2088',
    car_number: '2140',
    lrv_consist_count: 1,
    lrv_consist_1: '2140',
    lrv_fleet_type: 'KIN - Kinki Sharyo USA 2005',
    rail_line: 'Red',
    lrv_end_of_line: 'Parker Road',
    street_on: 'Rail yard - switch S-14',
    cross_street: 'Yard access road',
    city: 'Dallas',
    zip: '75201',
    location_category: 'Non-Revenue facility/Yard',
    train_status_before: 'Pull-In',
    train_status_after: 'In Yard',
    derailment_type: 'Yard',
    train_action: 'Proceeding Through a Switch',
    train_speed: '8',
    train_damage: true,
    runaway_train: false,
    lrv_evacuation: false,
    weather: 'Clear',
    road_conditions: 'Dry',
    lighting_conditions: 'Dark',
    streetlights: 'Streetlights On',
    traffic_conditions: 'Light',
    traffic_controls: 'N/A',
    roadway_configuration: 'Train Yard',
    operator_injured: false,
    operator_transported: false,
    passengers_on_board: 0,
    passenger_fatalities: 0,
    passengers_injured: 0,
    pedestrians_involved: 0,
    police_at_scene: false,
    people: [],
    other_vehicles: [],
    supervisor_dart_vehicle_type: 'Light Rail Vehicle',
    supervisor_vehicle_number: 'T-2088',
    supervisor_car_number: '2140',
    supervisor_report_type: 'Derailment',
    supervisor_derailment_confirmed: true,
    supervisor_confirmation_checked: true,
    supervisor_event_description: 'The lead truck of car 2140 derailed at low speed on the yard switch approach. No injuries or collision occurred. The operator secured the train and notified rail control.',
    operator_datetime_correct: true,
    program_manager_contributing_factors_list: [],
  },
};

const INITIAL_REPORTS: WorkflowReport[] = [
  {
    id: 'AE-2026-1052',
    initiatedBy: 'Supervisor',
    workflowStage: 'operator-completion',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'pending' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-08-26T15:40:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 1,
    createdAt: '2026-08-26T14:30:00.000Z',
    lastSavedAt: '2026-08-26T15:40:00.000Z',
    dueBy: '08/29/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('90001'),
      is_on_behalf: true,
      on_behalf_employee: '90001',
      event_type: 'Collision',
      mode: 'Bus',
      operating_dart_vehicle: true,
      incident_date: '2026-08-26',
      incident_time: '14:18',
      description_of_event: 'A passenger vehicle struck the rear corner of the bus while changing lanes on Route 15.',
      vehicle_number: '5201',
      route_number: '15',
      street_on: 'Cedar Boulevard',
      cross_street: '7th Street',
      city: 'Dallas',
      zip: '75203',
      address_of_event: 'Cedar Boulevard at 7th Street, Dallas TX 75203',
      location_category: 'Street',
      bus_status_before: 'In Service',
      bus_status_after: 'In Service',
      collision_type: 'Collision – with Auto',
      operator_injured: false,
      passengers_on_board: 8,
      passengers_injured: 0,
      pedestrians_involved: 0,
      police_at_scene: true,
      people: [],
      other_vehicles: [],
    },
  },
  railContributingFactorsQueueReport,
  // One case per active role state so we can focus on component polish.
  {
    id: 'AE-2026-1050',
    initiatedBy: 'Operator',
    workflowStage: 'program-manager-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-07-15T09:20:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-07-15T11:00:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-07-15T09:00:00.000Z',
    lastSavedAt: '2026-07-15T11:00:00.000Z',
    dueBy: '07/18/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('90001'),
      is_on_behalf: false,
      event_type: 'Collision',
      mode: 'Bus',
      operating_dart_vehicle: true,
      incident_date: '2026-07-15',
      incident_time: '09:12',
      description_of_event: 'A sedan merged from the curb lane on Route 15 and struck the right side of the bus. Operator stopped, checked passengers, and notified dispatch.',
      vehicle_number: '2045',
      fleet_type: '40 ft bus',
      route_number: '15',
      run_number: '15-04',
      street_on: 'Cedar Blvd',
      cross_street: '7th St',
      city: 'Dallas',
      zip: '75203',
      address_of_event: 'Cedar Blvd at 7th St, Dallas TX 75203',
      location_category: 'Street',
      event_at_bus_stop: true,
      bus_stop_name: 'Cedar Blvd at 7th St',
      bus_status_before: 'In Service',
      bus_status_after: 'In Service',
      collision_type: 'Collision – with Auto',
      bus_action: 'Moving Straight',
      bus_speed: '18',
      point_of_impact: 'Right Side Impact',
      bus_damage: true,
      bus_damage_confirmed: true,
      impact_markers: [
        { x: 47, y: 68, label: 'Right Side' },
        { x: 79, y: 53, label: 'Front' },
      ],
      runaway_vehicle: false,
      parking_brake_engaged: true,
      evacuation_life_safety: false,
      weather: 'Clear',
      road_conditions: 'Dry',
      lighting_conditions: 'Daylight',
      streetlights: 'Streetlights On',
      traffic_conditions: 'Medium',
      traffic_controls: 'Traffic Light',
      roadway_configuration: 'Two Lane Road',
      operator_injured: false,
      passengers_on_board: 14,
      passenger_fatalities: 0,
      passengers_injured: 1,
      passengers_transported: 1,
      passengers_fled: 0,
      courtesy_cards: 1,
      people: [
        { id: 'p-1', role: 'Passenger', name: 'Ana Rodriguez', injured: true, injured_body_part: 'Neck', transported_to_hospital: true, fled_scene: false, courtesy_card: true },
        { id: 'p-2', role: 'Passenger', name: 'Marcus Chen', injured: false },
      ],
      other_vehicles: [
        { id: 'ov-1', vehicle_type: 'Passenger Auto/St Wagon', action: 'Changing lanes', direction: 'Same direction', occupants: 2, injuries: 1, fatalities: 0, transported: 1, fled: 0, damage: true, damage_area: ['Right Side', 'Front'], point_of_impact: 'Right Side', tow_away: true },
      ],
      pedestrians_involved: 0,
      police_at_scene: true,
      police_type: 'Dallas Police',
      dart_supervisor_investigating: true,
      severity_level: 'Moderate',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_first_name: 'Alexia',
      supervisor_last_name: 'Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_arrival_date: '2026-07-15',
      supervisor_arrival_time: '09:28',
      supervisor_incident_date: '2026-07-15',
      supervisor_incident_time: '09:12',
      supervisor_address_of_event: 'Cedar Blvd at 7th St, Dallas TX 75203',
      supervisor_location_category: 'Street',
      supervisor_event_description: 'Arrived on scene, secured the area, and documented right-side contact damage. Sedan driver cited for unsafe lane change.',
      supervisor_report_type: 'Collision',
      supervisor_dart_vehicle_type: 'Bus',
      supervisor_vehicle_number: '2045',
      supervisor_scene_diagram_completed: true,
      supervisor_scene_photos_taken: true,
      supervisor_dart_vehicle_damaged: true,
      supervisor_damage_requires_tow: false,
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
      supervisor_impact_markers: [
        { x: 47, y: 68, label: 'Right Side' },
        { x: 79, y: 53, label: 'Front' },
        { x: 72, y: 78, label: 'Front Wheel Right' },
      ],
      supervisor_other_vehicles_involved: true,
      supervisor_other_vehicle_count: 1,
      supervisor_other_vehicle_damage_count: 1,
      supervisor_other_vehicle_tow_count: 1,
      supervisor_dart_employee_fatalities: false,
      supervisor_dart_employee_injuries: false,
      supervisor_passenger_fatalities: false,
      supervisor_passenger_injuries: true,
      supervisor_passenger_injury_count: 1,
      supervisor_collision_between_dart_vehicles: false,
      supervisor_police_called: true,
      supervisor_confirmation_checked: true,
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1044',
    initiatedBy: 'Operator',
    workflowStage: 'supervisor-review',
    overallStatus: 'correction-requested',
    sections: {
      operator: {
        key: 'operator',
        ownerRole: 'Operator',
        label: 'Operator section',
        status: 'submitted',
        submittedBy: 'Operator',
        submittedAt: '2026-06-11T08:40:00.000Z',
      },
      supervisor: {
        key: 'supervisor',
        ownerRole: 'Supervisor',
        label: 'Supervisor section collision',
        status: 'returned',
        submittedBy: 'Supervisor',
        submittedAt: '2026-06-11T09:05:00.000Z',
        returnedBy: 'Program Manager',
        returnedAt: '2026-06-11T09:40:00.000Z',
        correctionNote: 'Add the field supervisor statement and confirm the passenger injury severity before I can classify this.',
      },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-06-11T07:40:00.000Z',
    lastSavedAt: '2026-06-11T09:40:00.000Z',
    dueBy: '06/12/2026',
    lastSubmittedBy: 'Program Manager',
    handoffNote: 'Add the field supervisor statement and confirm the passenger injury severity before I can classify this.',
    handoffHistory: [
      {
        id: 'AE-2026-1044-1',
        fromRole: 'Operator',
        toRole: 'Supervisor',
        fromStage: 'operator-completion',
        toStage: 'supervisor-review',
        action: 'forwarded',
        createdAt: '2026-06-11T08:40:00.000Z',
      },
      {
        id: 'AE-2026-1044-2',
        fromRole: 'Supervisor',
        toRole: 'Program Manager',
        fromStage: 'supervisor-review',
        toStage: 'program-manager-review',
        action: 'section-submitted',
        targetSection: 'supervisor',
        createdAt: '2026-06-11T09:05:00.000Z',
      },
      {
        id: 'AE-2026-1044-3',
        fromRole: 'Program Manager',
        toRole: 'Supervisor',
        fromStage: 'program-manager-review',
        toStage: 'supervisor-review',
        action: 'section-returned',
        targetSection: 'supervisor',
        note: 'Add the field supervisor statement and confirm the passenger injury severity before I can classify this.',
        createdAt: '2026-06-11T09:40:00.000Z',
      },
    ],
    closedAt: null,
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-11',
      incident_time: '07:36',
      vehicle_number: '2045',
      route_number: '15',
      street_on: 'Maple Ave',
      cross_street: '9th St',
      city: 'Dallas',
      description_of_event: 'Program manager returned the supervisor section for clarification before final classification.',
      severity_level: 'Moderate',
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1041',
    initiatedBy: 'Operator',
    workflowStage: 'operator-completion',
    overallStatus: 'open',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'in-progress' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'not-started' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'not-started' },
    },
    currentStep: 2,
    createdAt: '2026-06-09T14:10:00.000Z',
    lastSavedAt: '2026-06-09T14:22:00.000Z',
    dueBy: '06/13/2026',
    lastSubmittedBy: null,
    closedAt: null,
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-09',
      incident_time: '14:08',
      vehicle_number: '5201',
      route_number: '5',
      street_on: 'Elm St',
      cross_street: '2nd Ave',
      city: 'Dallas',
      zip: '75202',
      severity_level: 'Minor',
    },
  },
  {
    id: 'AE-2026-1025',
    initiatedBy: 'Operator',
    workflowStage: 'closed',
    overallStatus: 'closed',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'accepted', submittedBy: 'Operator', submittedAt: '2026-06-05T10:00:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'accepted', submittedBy: 'Supervisor', submittedAt: '2026-06-05T11:10:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'accepted', submittedBy: 'Program Manager', submittedAt: '2026-06-05T12:20:00.000Z' },
    },
    currentStep: 4,
    createdAt: '2026-06-05T09:10:00.000Z',
    lastSavedAt: '2026-06-05T12:20:00.000Z',
    dueBy: '06/09/2026',
    lastSubmittedBy: 'Program Manager',
    closedAt: '2026-06-05T12:20:00.000Z',
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-05',
      incident_time: '09:02',
      vehicle_number: '4089',
      route_number: '201',
      street_on: 'Pine Ave',
      cross_street: '8th St',
      city: 'Dallas',
      zip: '75204',
      description_of_event: 'Closed after final program manager classification.',
      severity_level: 'Minor',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_arrival_date: '2026-06-05',
      supervisor_arrival_time: '09:18',
      supervisor_event_description: 'No injuries observed. Minor property contact documented at the scene.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
      operator_datetime_correct: true,
      employee_contacted_program_manager_date: '2026-06-05',
      program_manager_collision_with: 'Collision – with Fixed Object',
      action_taken: 'Reviewed operator and supervisor sections. Classification recorded.',
      program_manager_classification: 'Preventable',
      confirmation_checked: true,
    },
  },
];


export default function App() {
  return (
    <UserRoleProvider>
      <AppBody />
    </UserRoleProvider>
  );
}

function AppBody() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [reports, setReports] = useState<WorkflowReport[]>(INITIAL_REPORTS);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  // Dev-only: lets a scenario land the wizard on a specific sub-step (e.g. jump SPM straight to People and Impact).
  const [devInitialStep, setDevInitialStep] = useState<number | undefined>(undefined);
  const { setRole } = useUserRole();

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    if (view !== 'new-report') {
      setActiveReportId(null);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveReportId(null);
  };

  const handleStartNewReport = () => {
    setActiveReportId(null);
    setCurrentView('new-report');
  };

  const handleOpenReport = (reportId: string) => {
    setActiveReportId(reportId);
    setCurrentView('new-report');
  };

  const handleSaveReport = (report: WorkflowReport) => {
    setReports((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === report.id);
      if (existingIndex === -1) {
        return [report, ...prev];
      }

      const next = [...prev];
      next[existingIndex] = report;
      return next;
    });
    setActiveReportId(report.id);
  };

  const handleDeleteDraft = (reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
    if (activeReportId === reportId) {
      setActiveReportId(null);
    }
  };

  const activeReport = activeReportId ? reports.find((report) => report.id === activeReportId) || null : null;

  const handleApplyScenario = (scenario: DevScenario) => {
    setRole(scenario.role);
    setDevInitialStep(undefined);
    switch (scenario.action.type) {
      case 'go-home':
        setActiveReportId(null);
        setCurrentView('home');
        break;
      case 'new-blank':
        setActiveReportId(null);
        setCurrentView('new-report');
        break;
      case 'open-existing':
        setActiveReportId(scenario.action.reportId);
        setCurrentView('new-report');
        break;
      case 'inject-and-open': {
        const report = scenario.action.report;
        setReports((prev) => {
          const idx = prev.findIndex((r) => r.id === report.id);
          if (idx === -1) return [report, ...prev];
          const next = [...prev];
          next[idx] = report;
          return next;
        });
        setActiveReportId(report.id);
        setDevInitialStep(scenario.action.initialStep);
        setCurrentView('new-report');
        break;
      }
      case 'inject-many-and-open': {
        const incoming = scenario.action.reports;
        setReports((prev) => {
          const next = [...prev];
          for (const r of incoming) {
            const idx = next.findIndex((existing) => existing.id === r.id);
            if (idx === -1) next.unshift(r);
            else next[idx] = r;
          }
          return next;
        });
        setActiveReportId(scenario.action.openId);
        setCurrentView('new-report');
        break;
      }
    }
  };

  return (
    <>
      {currentView === 'home' && (
        <OperatorHome
          onNavigate={handleNavigate}
          onStartNewReport={handleStartNewReport}
          onOpenReport={handleOpenReport}
          onDeleteDraft={handleDeleteDraft}
          reports={reports}
        />
      )}

      {currentView === 'new-report' && (
        <AccidentReportWizard
          key={activeReportId ?? 'new'}
          onNavigate={handleNavigate}
          onBackToHome={handleBackToHome}
          initialReport={activeReport}
          initialStep={devInitialStep}
          onSaveReport={handleSaveReport}
          existingReports={reports}
          onOpenReport={handleOpenReport}
        />
      )}

      {currentView === 'drafts' && (
        <MyDrafts
          onNavigate={handleNavigate}
          onBackToHome={handleBackToHome}
          onResumeReport={handleOpenReport}
          onDeleteDraft={handleDeleteDraft}
          drafts={reports}
        />
      )}

      {currentView === 'submissions' && (
        <MySubmissions
          onNavigate={handleNavigate}
          onBackToHome={handleBackToHome}
          reports={reports}
        />
      )}

      {/* Dev drawer: visible in `vite dev`, on any *.vercel.app deploy, when ?dev=1
          is in the URL, or once the flag has been persisted via localStorage. */}
      {shouldShowDevScenarios() && (
        <DevScenariosDrawer
          activeReport={activeReport}
          currentView={currentView}
          onApply={handleApplyScenario}
        />
      )}
    </>
  );
}

function shouldShowDevScenarios(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('dev') === '1') {
    try { window.localStorage.setItem('dart_dev', '1'); } catch {}
    return true;
  }
  if (params.get('dev') === '0') {
    try { window.localStorage.removeItem('dart_dev'); } catch {}
    return false;
  }

  try {
    if (window.localStorage.getItem('dart_dev') === '1') return true;
  } catch {}

  // All Vercel review URLs (preview + prod deploys on *.vercel.app) show the drawer
  // by default so review links don't require a query-string handshake. A real
  // custom production domain (e.g. safety.dart.org) will NOT match and stays clean.
  const host = window.location.hostname;
  return host.endsWith('.vercel.app') || host === 'localhost' || host === '127.0.0.1';
}