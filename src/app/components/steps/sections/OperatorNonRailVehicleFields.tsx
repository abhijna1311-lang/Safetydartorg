import { AnimatePresence, motion } from 'motion/react';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { CustomSelect } from '../../CustomSelect';
import { FormField as Field } from '../../form/FormField';
import { DatePickerInput } from '../../DatePickerInput';
import { TimePickerInput } from '../../TimePickerInput';
import type { AccidentReportData } from '../../../types/accident-report';

export type FleetVehicle = {
  id: string;
  type?: string;
  fleetType?: string;
  pulloutDate?: string;
  pulloutTime?: string;
};

export type VehicleNumberField = 'vehicle_number' | 'train_number';
export type StatusFieldConfig = {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: boolean;
};

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export function OperatorNonRailVehicleFields({
  data,
  onUpdate,
  fleet,
  numberField = 'vehicle_number',
  label,
  placeholder,
  showErrors = false,
  typeLabel = 'Vehicle type',
  icon = 'directions_car',
  statusBefore,
  statusAfter,
  requiredVehicleNumber = true,
}: {
  data: AccidentReportData;
  onUpdate: (data: Partial<AccidentReportData>) => void;
  fleet: FleetVehicle[];
  numberField?: VehicleNumberField;
  label: string;
  placeholder: string;
  showErrors?: boolean;
  typeLabel?: string;
  icon?: string;
  statusBefore?: StatusFieldConfig;
  statusAfter?: StatusFieldConfig;
  requiredVehicleNumber?: boolean;
}) {
  const value = data[numberField] as string | undefined;
  const selected = fleet.find(vehicle => vehicle.id === value);
  const options: ComboboxOption[] = [...fleet]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(vehicle => ({ value: vehicle.id, label: vehicle.id, description: vehicle.type || vehicle.fleetType }));
  const statusFields = [statusBefore, statusAfter].filter(Boolean) as StatusFieldConfig[];
  const hasStatusFields = statusFields.length > 0;

  const handleChange = (nextValue: string) => {
    const vehicle = fleet.find(item => item.id === nextValue);
    onUpdate({
      [numberField]: nextValue,
      fleet_type: vehicle?.type,
      lrv_fleet_type: vehicle?.fleetType,
      employee_pullout_date: vehicle?.pulloutDate,
      employee_pullout_time: vehicle?.pulloutTime,
      train_pullout_date: vehicle?.pulloutDate,
      train_pullout_time: vehicle?.pulloutTime,
      ...(numberField === 'train_number' ? { car_number: undefined } : {}),
    } as Partial<AccidentReportData>);
  };

  return (
    <>
      <AnimatePresence>
        {selected && (
          <motion.div {...fade} key="operator-vehicle-record">
            <div className="dart-vehicle-strip">
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">{icon}</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">{typeLabel}</span><span className="dart-vehicle-value">{selected.type || selected.fleetType || '\u2014'}</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ marginTop: selected ? 26 : undefined }} className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <Field label={label} required={requiredVehicleNumber} error={showErrors && requiredVehicleNumber && !value}>
          <SearchableCombobox options={options} value={value || ''} onChange={handleChange} placeholder={placeholder} searchPlaceholder="Type vehicle number..." emptyMessage="No vehicles found" />
        </Field>
        <Field label="Pull-out date" required error={showErrors && !data.employee_pullout_date}>
          <DatePickerInput value={data.employee_pullout_date || ''} onChange={value => onUpdate({ employee_pullout_date: value, train_pullout_date: value })} />
        </Field>
        <Field label="Pull-out time" required error={showErrors && !data.employee_pullout_time}>
          <TimePickerInput value={data.employee_pullout_time || ''} onChange={value => onUpdate({ employee_pullout_time: value, train_pullout_time: value })} />
        </Field>
        {statusFields.map(status => (
          <Field key={status.label} label={status.label} required error={status.error}>
            <CustomSelect value={status.value || ''} onChange={status.onChange} options={status.options} placeholder="Select status" />
          </Field>
        ))}
      </div>
    </>
  );
}
