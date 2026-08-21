import { BusVehicleFields, BUS_STATUS_OPTIONS } from './BusCollisionSection';
import { OperatorNonRailVehicleFields, type FleetVehicle, type StatusFieldConfig, type VehicleNumberField } from './OperatorNonRailVehicleFields';
import { RailVehicleFields, RAIL_LINE_STATUSES, TRAIN_STATUS_OPTIONS } from './RailVehicleFields';
import { getVehicleStatusOptions } from './assault/assaultFlow';
import { HI_RAIL_FLEET, NRV_FLEET } from './operatorVehicleFleets';
import type { AccidentReportData } from '../../../types/accident-report';

type VehicleStatusField = 'bus_status_before' | 'bus_status_after' | 'train_status_before' | 'train_status_after' | 'vehicle_status_before' | 'vehicle_status_after';

type Props = {
  data: AccidentReportData;
  onUpdate: (data: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
  statusBeforeField?: VehicleStatusField;
  statusAfterField?: VehicleStatusField;
  statusBeforeOptions?: { value: string; label: string }[];
  statusAfterOptions?: { value: string; label: string }[];
  statusBeforeDisabled?: boolean;
  statusBeforePlaceholder?: string;
  showRailLine?: boolean;
  showStatusFields?: boolean;
  showVehicleDetails?: boolean;
  showLrvConsist?: boolean;
  requiredVehicleNumber?: boolean;
  help?: string;
  vehicleNumberField?: VehicleNumberField;
  nonRailFleet?: FleetVehicle[];
};

function Section({ title, help, children }: { title: string; help: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ModeVehicleSection({
  data,
  onUpdate,
  showErrors = false,
  statusBeforeField,
  statusAfterField,
  statusBeforeOptions,
  statusAfterOptions,
  statusBeforeDisabled = false,
  statusBeforePlaceholder,
  showRailLine,
  showStatusFields = true,
  showVehicleDetails = true,
  showLrvConsist = true,
  requiredVehicleNumber = true,
  help,
  vehicleNumberField,
  nonRailFleet,
}: Props) {
  const isBus = data.mode === 'Bus';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isHiRail = data.mode === 'Hi-Rail';
  const isNRV = data.mode === 'Non-Revenue Vehicle';
  const isRail = isLRV || isStreetcar;
  const shouldShowStatusFields = showStatusFields && !isNRV && !isHiRail;
  const vehicleStatusOptions = getVehicleStatusOptions(data.mode).map(status => ({ value: status.value, label: status.label }));
  const defaultStatusOptions = isBus ? BUS_STATUS_OPTIONS : isHiRail || isNRV ? vehicleStatusOptions : TRAIN_STATUS_OPTIONS;
  const beforeOptions = statusBeforeOptions || defaultStatusOptions;
  const afterOptions = statusAfterOptions || defaultStatusOptions;
  const beforeField = statusBeforeField || (isBus ? 'bus_status_before' : isRail ? 'train_status_before' : 'vehicle_status_before');
  const afterField = statusAfterField || (isBus ? 'bus_status_after' : isRail ? 'train_status_after' : 'vehicle_status_after');
  const title = 'The Vehicle';
  const defaultHelp = isBus
    ? 'Enter the bus number and Block ID. The route and assigned vehicle details are pulled in automatically.'
    : isRail
      ? `Enter the ${isStreetcar ? 'streetcar' : 'LRV'} number. Its assigned fleet and schedule are pulled in automatically.`
      : 'Enter the vehicle number. Its assigned fleet and pull-out details are pulled in automatically.';
  const railLine = (showRailLine ?? (isLRV && !isStreetcar))
    && (!isLRV || RAIL_LINE_STATUSES.has(data.train_status_before || ''));

  if (!isBus && !isRail && !isHiRail && !isNRV) return null;

  return (
    <Section title={title} help={help || defaultHelp}>
      <ModeVehicleFields
        data={data}
        onUpdate={onUpdate}
        showErrors={showErrors}
        statusBeforeField={beforeField}
        statusAfterField={afterField}
        statusBeforeOptions={beforeOptions}
        statusAfterOptions={afterOptions}
        statusBeforeDisabled={statusBeforeDisabled}
        statusBeforePlaceholder={statusBeforePlaceholder}
        showRailLine={railLine}
        showStatusFields={shouldShowStatusFields}
        showVehicleDetails={showVehicleDetails}
        showLrvConsist={showLrvConsist}
        requiredVehicleNumber={requiredVehicleNumber}
        vehicleNumberField={vehicleNumberField}
        nonRailFleet={nonRailFleet}
      />
    </Section>
  );
}

export function ModeVehicleFields({
  data,
  onUpdate,
  showErrors = false,
  statusBeforeField,
  statusAfterField,
  statusBeforeOptions,
  statusAfterOptions,
  statusBeforeDisabled = false,
  statusBeforePlaceholder,
  showRailLine,
  showStatusFields = true,
  showVehicleDetails = true,
  showLrvConsist = true,
  requiredVehicleNumber = true,
  vehicleNumberField,
  nonRailFleet,
}: Omit<Props, 'help'>) {
  const isBus = data.mode === 'Bus';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isHiRail = data.mode === 'Hi-Rail';
  const isNRV = data.mode === 'Non-Revenue Vehicle';
  const isRail = isLRV || isStreetcar;
  const shouldShowStatusFields = showStatusFields && !isNRV && !isHiRail;
  const vehicleStatusOptions = getVehicleStatusOptions(data.mode).map(status => ({ value: status.value, label: status.label }));
  const defaultStatusOptions = isBus ? BUS_STATUS_OPTIONS : isHiRail || isNRV ? vehicleStatusOptions : TRAIN_STATUS_OPTIONS;
  const beforeOptions = statusBeforeOptions || defaultStatusOptions;
  const afterOptions = statusAfterOptions || defaultStatusOptions;
  const beforeField = statusBeforeField || (isBus ? 'bus_status_before' : isRail ? 'train_status_before' : 'vehicle_status_before');
  const afterField = statusAfterField || (isBus ? 'bus_status_after' : isRail ? 'train_status_after' : 'vehicle_status_after');
  const railLine = (showRailLine ?? (isLRV && !isStreetcar))
    && (!isLRV || RAIL_LINE_STATUSES.has(data.train_status_before || ''));

  if (isBus) {
    return (
      <BusVehicleFields
        data={data}
        onUpdate={onUpdate}
        showErrors={showErrors}
        statusBeforeField={beforeField as 'bus_status_before' | 'vehicle_status_before'}
        statusAfterField={afterField as 'bus_status_after' | 'vehicle_status_after'}
        statusOptions={beforeOptions}
        showStatusFields={shouldShowStatusFields}
        showVehicleDetails={showVehicleDetails}
        requiredVehicleNumber={requiredVehicleNumber}
      />
    );
  }

  if (isRail) {
    return (
      <RailVehicleFields
        data={data}
        onUpdate={onUpdate}
        showErrors={showErrors}
        statusBeforeField={beforeField as 'train_status_before' | 'vehicle_status_before'}
        statusAfterField={afterField as 'train_status_after' | 'vehicle_status_after'}
        statusBeforeOptions={beforeOptions}
        statusAfterOptions={afterOptions}
        statusBeforeDisabled={statusBeforeDisabled}
        statusBeforePlaceholder={statusBeforePlaceholder}
        showRailLine={railLine}
        showStatusFields={shouldShowStatusFields}
        showVehicleDetails={showVehicleDetails}
        showConsist={showLrvConsist}
        requiredVehicleNumber={requiredVehicleNumber}
      />
    );
  }

  if (isHiRail || isNRV) {
    const fleet = nonRailFleet || (isHiRail ? HI_RAIL_FLEET : NRV_FLEET);
    const numberField = vehicleNumberField || 'vehicle_number';
    return (
      <OperatorNonRailVehicleFields
        data={data}
        onUpdate={onUpdate}
        fleet={fleet}
        numberField={numberField}
        label={isHiRail ? 'Hi-Rail vehicle number' : 'Vehicle number'}
        placeholder="Search vehicle #"
        showErrors={showErrors}
        typeLabel={isHiRail ? 'Fleet type' : 'Vehicle type'}
        icon={isHiRail ? 'local_shipping' : 'directions_car'}
        statusBefore={shouldShowStatusFields ? statusConfig(data, beforeField, beforeOptions, onUpdate, showErrors) : undefined}
        statusAfter={shouldShowStatusFields ? statusConfig(data, afterField, afterOptions, onUpdate, showErrors) : undefined}
        requiredVehicleNumber={requiredVehicleNumber}
      />
    );
  }

  return null;
}

function statusConfig(
  data: AccidentReportData,
  field: VehicleStatusField,
  options: { value: string; label: string }[],
  onUpdate: (data: Partial<AccidentReportData>) => void,
  showErrors: boolean,
): StatusFieldConfig {
  const value = data[field] as string | undefined;
  return {
    label: field.endsWith('_before') ? 'Status before event' : 'Status after event',
    value,
    options,
    onChange: nextValue => onUpdate({ [field]: nextValue } as Partial<AccidentReportData>),
    error: showErrors && !value,
  };
}
