import type { AccidentReportData } from '../types/accident-report';
import type { WorkflowReport } from '../types/workflow-report';

export interface PossibleDuplicate {
  report: WorkflowReport;
  matchingFields: string[];
}

function normalize(value?: string | number | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function valuesMatch(left?: string | number | null, right?: string | number | null) {
  const normalizedLeft = normalize(left);
  return Boolean(normalizedLeft && normalizedLeft === normalize(right));
}

function getVehicleIdentifiers(data: AccidentReportData) {
  return [
    data.vehicle_number,
    data.train_number,
    data.car_number,
    data.lrv_consist_1,
    data.lrv_consist_2,
    data.lrv_consist_3,
    data.lrv_consist_4,
  ]
    .map(normalize)
    .filter(Boolean);
}

function getEventLocation(data: AccidentReportData) {
  const streetLocation = [data.street_on, data.cross_street].filter(Boolean).join(' & ');
  return streetLocation
    || data.address_of_event
    || data.station_applicable
    || data.grade_crossing_applicable
    || data.tunnel_location
    || data.bus_stop_name
    || '';
}

function getMatchingFields(current: AccidentReportData, existing: AccidentReportData) {
  const matches: string[] = [];

  if (
    valuesMatch(current.route_number, existing.route_number)
    && valuesMatch(current.block_number, existing.block_number)
  ) {
    matches.push('Route and Block');
  }

  const currentVehicles = getVehicleIdentifiers(current);
  const existingVehicles = new Set(getVehicleIdentifiers(existing));
  if (currentVehicles.some((vehicle) => existingVehicles.has(vehicle))) {
    matches.push('Vehicle Number');
  }

  if (valuesMatch(current.event_type, existing.event_type)) matches.push('Event Type');
  if (valuesMatch(current.mode, existing.mode)) matches.push('Mode');
  if (valuesMatch(getEventLocation(current), getEventLocation(existing))) matches.push('Event Location');

  return matches;
}

export function findPossibleDuplicate(
  current: AccidentReportData,
  reports: WorkflowReport[],
  currentReportId: string,
): PossibleDuplicate | null {
  if (!normalize(current.employee_badge_number) || !current.incident_date) return null;

  const candidates = reports
    .filter((report) => (
      report.id !== currentReportId
      && valuesMatch(current.employee_badge_number, report.formData.employee_badge_number)
      && current.incident_date === report.formData.incident_date
    ))
    .map((report) => ({
      report,
      matchingFields: getMatchingFields(current, report.formData),
      sameTime: Boolean(current.incident_time && current.incident_time === report.formData.incident_time),
    }))
    .filter((candidate) => candidate.matchingFields.length > 0)
    .sort((left, right) => (
      Number(right.sameTime) - Number(left.sameTime)
      || right.matchingFields.length - left.matchingFields.length
      || right.report.lastSavedAt.localeCompare(left.report.lastSavedAt)
    ));

  const bestMatch = candidates[0];
  return bestMatch
    ? { report: bestMatch.report, matchingFields: bestMatch.matchingFields }
    : null;
}
