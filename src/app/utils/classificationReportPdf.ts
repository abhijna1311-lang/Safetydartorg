import dartLogo from '../../assets/DART-Logo.png';
import type { AccidentReportData } from '../types/accident-report';

/**
 * Builds the "Safety Program Manager Classification Report" (form OS-1A) from
 * case data and hands it to the browser's print pipeline so the SPM can save
 * it as a PDF. Layout mirrors the official DART classification record.
 *
 * TODO: swap for a server-rendered PDF endpoint when the reporting API lands.
 */

const FORM_REVISION = 'OS-1A rev09/23';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function text(value: string | number | null | undefined, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback;
  return escapeHtml(String(value));
}

export function formatMdy(value?: string) {
  if (!value) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  return value;
}

function formatTime12h(value?: string) {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${match[2]} ${suffix}`;
}

function yesNo(value: boolean | undefined) {
  if (value === undefined) return '<span class="muted">Not recorded</span>';
  return value ? '<span class="yes">Yes</span>' : 'No';
}

function anyTrue(...values: Array<boolean | undefined>): boolean | undefined {
  if (values.some((v) => v === true)) return true;
  if (values.some((v) => v === false)) return false;
  return undefined;
}

function anyPositive(...values: Array<number | undefined>): boolean | undefined {
  if (values.some((v) => typeof v === 'number' && v > 0)) return true;
  if (values.some((v) => typeof v === 'number')) return false;
  return undefined;
}

function lengthOfService(data: AccidentReportData) {
  const years = Number(data.service_years);
  const months = Number(data.service_months);
  const parts: string[] = [];
  if (data.service_years && !Number.isNaN(years)) parts.push(`${years} yr${years === 1 ? '' : 's'}`);
  if (data.service_months && !Number.isNaN(months)) parts.push(`${months} mo${months === 1 ? '' : 's'}`);
  return parts.join(' ');
}

function locationOf(data: AccidentReportData) {
  const street = data.supervisor_street_on || data.street_on;
  const cross = data.supervisor_cross_street || data.cross_street;
  const city = data.supervisor_city || data.city;
  const zip = data.supervisor_zip || data.zip;
  const address = data.supervisor_address_of_event || data.address_of_event;
  const corner = street && cross ? `${street} at ${cross}` : street || address || '';
  const tail = [city, zip].filter(Boolean).join(' ');
  return [corner, tail].filter(Boolean).join(', ');
}

export function getClassificationReportFileName(caseId: string) {
  return `Safety Event Report_${caseId}_Classification`;
}

export function buildClassificationReportHtml(data: AccidentReportData, caseId: string, logoUrl: string) {
  const classification = data.program_manager_classification_value || data.program_manager_classification || 'Not classified';
  const isPreventable = /^Preventable/.test(classification);
  const isRail = data.mode === 'Light Rail Vehicle' || data.mode === 'Streetcar';
  const vehicleId = isRail
    ? data.supervisor_car_number || data.car_number || data.train_number
    : data.supervisor_vehicle_number || data.vehicle_number;
  const route = isRail
    ? data.supervisor_rail_line || data.rail_line
    : data.supervisor_operating_route_number || data.route_number;
  const pmName = data.program_manager_classified_by_name
    || [data.program_manager_first_name, data.program_manager_last_name].filter(Boolean).join(' ');
  const classifiedOn = formatMdy(data.program_manager_classification_date);

  const dartDamage = anyTrue(
    data.program_manager_dart_vehicle_damaged,
    data.supervisor_dart_vehicle_damaged,
    data.bus_damage,
    data.train_damage,
  );
  const otherDamage = anyTrue(
    data.damage_to_property,
    data.other_vehicle_damage,
    anyPositive(data.supervisor_other_vehicle_damage_count),
  );
  const employeeInjury = anyTrue(
    data.program_manager_operator_outcome ? data.program_manager_operator_outcome !== 'Not Injured' : undefined,
    data.supervisor_operator_injured,
    data.operator_injured,
    anyPositive(data.program_manager_employee_injury_count, data.other_employees_injured_count),
  );
  const passengerInjury = anyPositive(
    data.program_manager_passenger_injury_count,
    data.supervisor_passenger_injury_count,
    data.passengers_injured,
  );
  const otherInjury = anyPositive(
    data.program_manager_pedestrian_injury_count,
    data.program_manager_other_vehicle_injury_count,
    data.supervisor_pedestrian_injury_count,
    data.supervisor_other_vehicle_injury_count,
    data.pedestrian_injuries,
    data.other_vehicle_injuries,
  );

  const field = (label: string, value: string, extraClass = '') =>
    `<div class="field ${extraClass}"><div class="label">${label}</div><div class="value">${value || '<span class="muted">Not recorded</span>'}</div></div>`;

  const statement = (label: string, value?: string) =>
    `<div class="statement"><div class="statement-label">${label}</div><div class="statement-body">${text(value) || '<span class="muted">Not recorded</span>'}</div></div>`;

  const sectionHead = (num: string, title: string) =>
    `<div class="section-head"><span class="num">${num}</span><h2>${title}</h2></div>`;

  const footer = `<div class="page-footer"><span><span class="caps">Safety Event ID</span> <strong>${text(caseId)}</strong></span><span>${FORM_REVISION}</span></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${text(getClassificationReportFileName(caseId))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  /* Print document is standalone, so brand tokens are restated here. */
  :root {
    --navy: #00205B;
    --yellow: #FFCD00;
    --plum: #5C2D62;
    --plum-tint: #F6F1F7;
    --ink: #0F172A;
    --ink-soft: #334155;
    --muted: #64748B;
    --rule: #CBD5E1;
    --panel: #F1F3F8;
    --amber: #8A6100;
    --red: #B42318;
  }
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Poppins', 'Segoe UI', sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.45; width: 8.5in; }
  /* Table wrapper repeats top/bottom spacers on every printed page; the footer is fixed into the bottom one. */
  table.layout { width: 100%; border-collapse: collapse; }
  table.layout td { padding: 0; }
  .header-space { height: 0.3in; }
  .footer-space { height: 0.65in; }
  .content { padding: 0 0.6in; }
  .keep { break-inside: avoid; page-break-inside: avoid; }
  .caps { font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--muted); }
  .muted { color: var(--muted); font-weight: 400; }
  .yes { color: var(--amber); }
  .red { color: var(--red); }

  .masthead { background: var(--navy); color: #fff; }
  .masthead-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0.28in 0.6in 0.2in; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand .logo { background: #fff; border-radius: 8px; padding: 6px 8px; display: grid; place-items: center; }
  .brand .logo img { height: 34px; display: block; }
  .brand .divider { width: 1px; height: 40px; background: rgba(255,255,255,0.35); }
  .brand h1 { margin: 0; font-size: 13.5pt; white-space: nowrap; font-weight: 600; letter-spacing: -0.01em; }
  .brand .sub { margin-top: 2px; font-size: 7pt; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.75); }
  .event-id { text-align: right; white-space: nowrap; }
  .event-id .caps { color: var(--yellow); }
  .event-id .id { font-size: 18pt; font-weight: 600; font-variant-numeric: tabular-nums; }
  .facts { display: grid; grid-template-columns: repeat(5, 1fr); border-top: 1px solid rgba(255,255,255,0.15); border-bottom: 4px solid var(--yellow); }
  .facts > div { padding: 10px 0 12px 0.25in; border-right: 1px solid rgba(255,255,255,0.15); }
  .facts > div:first-child { padding-left: 0.6in; }
  .facts > div:last-child { border-right: 0; }
  .facts .caps { color: rgba(255,255,255,0.7); }
  .facts .v { font-size: 11pt; font-weight: 600; font-variant-numeric: tabular-nums; }

  .identity { margin-top: 0.25in; border: 1px solid var(--plum); }
  .identity-top { display: grid; grid-template-columns: 1fr 1fr; }
  .classification { padding: 0.2in 0.25in; display: flex; flex-direction: column; justify-content: center; }
  .classification .caps { color: var(--plum); }
  .classification .big { font-size: 26pt; font-weight: 700; line-height: 1.1; margin-top: 4px; }
  .employee { background: var(--plum-tint); border-left: 1px solid var(--plum); padding: 12px 0.25in; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .employee .span2 { grid-column: span 2; }
  .identity-bottom { border-top: 1px solid var(--plum); padding: 10px 0.25in; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 16px; }
  .identity-bottom .span3 { grid-column: span 3; }

  .field .label { font-size: 7pt; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-soft); }
  .field .value { font-weight: 600; font-variant-numeric: tabular-nums; }

  .section-head { break-after: avoid; page-break-after: avoid; display: flex; align-items: center; gap: 12px; margin-top: 0.22in; padding-bottom: 6px; border-bottom: 2px solid var(--plum); }
  .section-head .num { background: var(--plum); color: #fff; font-size: 7.5pt; font-weight: 600; padding: 3px 8px; }
  .section-head h2 { margin: 0; font-size: 13pt; font-weight: 600; }

  .grid3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px 16px; padding: 10px 0; border-bottom: 1px solid var(--rule); }
  .grid3 .field .value { font-weight: 500; }
  .grid3 .span2 { grid-column: span 2; }
  .subhead { font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--plum); grid-column: 1 / -1; margin-bottom: -6px; }

  .statement { break-inside: avoid; display: grid; grid-template-columns: 2.1in 1fr; gap: 16px; padding: 9px 0; border-bottom: 1px solid var(--rule); }
  .statement-label { font-weight: 600; font-size: 9.5pt; }
  .statement-body { white-space: pre-wrap; }

  .justification { margin-top: 14px; background: var(--plum-tint); padding: 16px 0.25in; white-space: pre-wrap; }

  .box-row { display: grid; margin-top: 14px; border: 1px solid var(--rule); }
  .box-row > div { padding: 14px 0.2in; border-right: 1px solid var(--rule); }
  .box-row > div:last-child { border-right: 0; }
  .box-row .value { font-size: 16pt; font-weight: 600; font-variant-numeric: tabular-nums; }
  .write-in { margin-top: 18px; border-bottom: 1.5px solid var(--ink); height: 4px; }
  .cost { background: var(--navy); color: #fff; }
  .cost .label { color: rgba(255,255,255,0.75); }

  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 0.35in; margin-top: 14px; }
  .sig { margin-bottom: 18px; }
  .sig .line { border-bottom: 1.5px solid var(--ink); min-height: 26px; padding: 0 2px 2px; font-weight: 500; display: flex; align-items: flex-end; }
  .sig .caps { margin-top: 4px; color: var(--ink-soft); }

  .appeal { background: var(--panel); padding: 14px 0.25in; font-size: 9pt; }
  .appeal .caps { color: var(--navy); }
  .appeal a { color: var(--plum); }

  .confirm { display: grid; grid-template-columns: 2.9in 1fr; margin-top: 18px; border: 1px solid var(--plum); }
  .confirm-left { background: var(--plum); color: #fff; padding: 22px 0.25in; }
  .confirm-left .tag { display: flex; align-items: center; gap: 10px; font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
  .confirm-left .tag span { background: #fff; color: var(--plum); padding: 2px 7px; }
  .confirm-left .big { font-size: 20pt; font-weight: 600; margin-top: 6px; }
  .confirm-right { padding: 18px 0.25in; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }

  .page-footer { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; height: 0.5in; padding: 0 0.6in; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--rule); font-size: 8pt; color: var(--ink-soft); }
  .page-footer .caps { color: var(--ink-soft); }
</style>
</head>
<body>
    <header class="masthead">
      <div class="masthead-top">
        <div class="brand">
          <div class="logo"><img src="${text(logoUrl)}" alt="DART" /></div>
          <div class="divider"></div>
          <div>
            <h1>Safety Program Manager Classification Report</h1>
            <div class="sub">Dallas Area Rapid Transit · Final Classification Record</div>
          </div>
        </div>
        <div class="event-id">
          <div class="caps">Safety Event ID</div>
          <div class="id">${text(caseId)}</div>
        </div>
      </div>
      <div class="facts">
        <div><div class="caps">Event type</div><div class="v">${text(data.event_type, 'Not recorded')}</div></div>
        <div><div class="caps">Vehicle mode</div><div class="v">${text(data.mode, 'Not recorded')}</div></div>
        <div><div class="caps">Vehicle 1 · DART</div><div class="v">${text(vehicleId, 'Not recorded')}</div></div>
        <div><div class="caps">Incident date</div><div class="v">${text(formatMdy(data.incident_date), 'Not recorded')}</div></div>
        <div><div class="caps">Incident time</div><div class="v">${text(formatTime12h(data.incident_time), 'Not recorded')}</div></div>
      </div>
    </header>

    <table class="layout">
    <thead><tr><td><div class="header-space"></div></td></tr></thead>
    <tfoot><tr><td><div class="footer-space"></div></td></tr></tfoot>
    <tbody><tr><td>
    <div class="content">
      <div class="identity keep">
        <div class="identity-top">
          <div class="classification">
            <div class="caps">Classification</div>
            <div class="big">${text(classification)}</div>
          </div>
          <div class="employee">
            ${field('Employee name', text(data.employee_name), 'span2')}
            ${field('Title', text(data.division_work))}
            ${field('Employee ID', text(data.employee_badge_number))}
            ${field('Employee division', text(data.assigned_division))}
            ${field('Department', text(data.department))}
          </div>
        </div>
        <div class="identity-bottom">
          ${field('Hired', text(formatMdy(data.date_of_hire)))}
          ${field('Length of service', text(lengthOfService(data)))}
          ${field('Supervisor', text(data.division_supervisor))}
          ${field('Cost center', text(data.cost_center))}
          ${field('Phone', text(data.employee_phone))}
          ${field('Address', text(data.employee_address), 'span3')}
        </div>
      </div>

      ${sectionHead('01', 'Accident Details')}
      <div class="grid3">
        ${field('Location of accident', text(locationOf(data)))}
        ${field(isRail ? 'Line' : 'Route', text(route))}
        ${field('Vehicle', text(data.mode))}
        ${field('Vehicle ID', text(vehicleId))}
        ${field('DART vehicle(s) damage', yesNo(dartDamage))}
        ${field('Damage to other vehicle/property', yesNo(otherDamage))}
      </div>
      <div class="grid3">
        <div class="subhead">Injuries</div>
        ${field('Employee', employeeInjury ? '<span class="red">Yes</span>' : yesNo(employeeInjury))}
        ${field('Passenger', passengerInjury ? '<span class="red">Yes</span>' : yesNo(passengerInjury))}
        ${field('Other', otherInjury ? '<span class="red">Yes</span>' : yesNo(otherInjury))}
      </div>
      <div class="grid3">
        ${field('Equipment malfunction alleged', yesNo(data.equipment_malfunction))}
        ${field('Action taken', text(data.action_taken), 'span2')}
      </div>

      ${sectionHead('02', 'Description and Statements')}
      ${statement('Description of occurrence', data.description_of_event || data.supervisor_event_description)}
      ${statement('Field supervisor statement', data.field_supervisor_statement || data.supervisor_operating_statement)}
      ${statement('Police statement', data.police_statement)}

      <div class="keep">
      ${sectionHead('03', 'Justification of Classification')}
      <div class="justification">${text(data.program_manager_classification_justification, '<span class="muted">Not recorded</span>')}</div>
      </div>

      <div class="keep">
      ${sectionHead('04', '30 Month Accident/Incident History')}
      <div class="box-row" style="grid-template-columns: 1fr 1fr;">
        <div><div class="caps">Prior preventable accidents</div><div class="write-in"></div></div>
        <div><div class="caps">Prior preventable incidents</div><div class="write-in"></div></div>
      </div>
      </div>

      <div class="keep">
      ${sectionHead('05', 'Video and Maximo')}
      <div class="box-row" style="grid-template-columns: 1fr 1fr 1fr;">
        <div><div class="caps">Video</div><div class="write-in"></div></div>
        <div><div class="caps">Maximo report #</div><div class="write-in"></div></div>
        <div class="cost"><div class="caps label">Maximo repair cost</div><div class="write-in" style="border-color:#fff;"></div></div>
      </div>
      </div>

      <div class="keep">
      ${sectionHead('06', 'Signatures')}
      <div class="signatures">
        <div>
          <div class="sig"><div class="line">${text(pmName)}</div><div class="caps">Safety manager’s signature</div></div>
          <div class="sig"><div class="line">${text(classifiedOn)}</div><div class="caps">Date</div></div>
        </div>
        <div>
          <div class="sig"><div class="line"></div><div class="caps">Employee’s signature</div></div>
          <div class="sig"><div class="line"></div><div class="caps">Date</div></div>
        </div>
        <div>
          <div class="sig"><div class="line"></div><div class="caps">Manager’s signature</div></div>
          <div class="sig"><div class="line"></div><div class="caps">Date</div></div>
        </div>
      </div>
      </div>

      ${isPreventable ? `<div class="appeal keep">
        <div class="caps">Appeal process</div>
        A Preventable Classification may be appealed by submitting a written statement referencing the file number above
        explaining why this event is believed to be a Non-Preventable Classification. Contact Juana De La Cruz in Agency
        Safety &amp; Compliance, within 5 days of receipt of this classification at <a href="mailto:JDelacru@dart.org">JDelacru@dart.org</a> with any further questions.
      </div>` : ''}

      <div class="confirm keep">
        <div class="confirm-left">
          <div class="tag"><span>07</span> Program manager confirmation</div>
          <div class="big">${data.program_manager_confirmation_checked === false ? 'Pending' : 'Confirmed'}</div>
        </div>
        <div class="confirm-right">
          ${field('Program manager', text(pmName))}
          ${field('Badge number', text(data.program_manager_classified_by_badge || data.program_manager_badge_number))}
          ${field('Department', text(data.program_manager_department))}
          ${field('Classification date', text(classifiedOn))}
        </div>
      </div>
    </div>
    </td></tr></tbody>
    </table>
    ${footer}
</body>
</html>`;
}

function toDataUrl(url: string) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * Renders the record into a hidden iframe and opens the browser's print dialog,
 * where "Save as PDF" is the destination. The document title becomes the
 * suggested file name.
 */
export async function downloadClassificationReport(data: AccidentReportData, caseId: string) {
  const logoUrl = await toDataUrl(new URL(dartLogo, window.location.href).href);
  const html = buildClassificationReportHtml(data, caseId, logoUrl);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 1000);
  };

  iframe.onload = async () => {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      cleanup();
      return;
    }
    try {
      await doc.fonts?.ready;
      await Promise.all(
        Array.from(doc.images).map((img) =>
          img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = img.onerror = resolve; }),
        ),
      );
    } catch {
      // Print anyway with fallback fonts.
    }
    const previousTitle = document.title;
    // Chrome uses the top-level title as the suggested PDF file name.
    document.title = getClassificationReportFileName(caseId);
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = previousTitle;
      cleanup();
    };
    win.addEventListener('afterprint', restore, { once: true });
    win.focus();
    win.print();
    // Most browsers block on print(); this covers ones that return immediately.
    window.setTimeout(restore, 60_000);
  };

  iframe.srcdoc = html;
}
