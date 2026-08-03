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

const INITIAL_REPORTS: WorkflowReport[] = [
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
      event_at_bus_stop: true,
      bus_stop_name: 'Cedar Blvd at 7th St',
      bus_status_before: 'In motion',
      bus_status_after: 'Stopped at scene',
      collision_type: 'Collision – with Auto',
      bus_action: 'Proceeding straight through traffic lane',
      point_of_impact: 'Right side midpoint near rear door',
      bus_speed: '18 mph',
      bus_damage: true,
      bus_damage_confirmed: true,
      weather: 'Clear',
      road_conditions: 'Dry',
      lighting_conditions: 'Daylight',
      passengers_on_board: 14,
      passengers_injured: 1,
      severity_level: 'Moderate',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_arrival_date: '2026-07-15',
      supervisor_arrival_time: '09:28',
      supervisor_event_description: 'Arrived on scene, secured the area, and documented right-side contact damage.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
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
          onNavigate={handleNavigate}
          onBackToHome={handleBackToHome}
          initialReport={activeReport}
          onSaveReport={handleSaveReport}
          existingReports={reports}
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

      {/* Dev drawer: visible in `vite dev` OR when ?dev=1 is in the URL on any deploy. */}
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
  return params.get('dev') === '1';
}