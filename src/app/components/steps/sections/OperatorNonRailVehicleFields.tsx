import { AnimatePresence, motion } from 'motion/react';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { FormField as Field } from '../../form/FormField';
import type { AccidentReportData } from '../../../types/accident-report';

type FleetVehicle = {
  id: string;
  type?: string;
  fleetType?: string;
  pulloutDate?: string;
  pulloutTime?: string;
};

type VehicleNumberField = 'vehicle_number' | 'train_number';

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

function fmtDate(value?: string) {
  if (!value) return '\u2014';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${month}/${day}/${year}` : value;
}

function fmtTime(value?: string) {
  if (!value) return '\u2014';
  const [hour, minute = '00'] = value.split(':');
  const hour24 = Number(hour);
  if (Number.isNaN(hour24)) return value;
  return `${hour24 % 12 || 12}:${minute.padStart(2, '0')} ${hour24 >= 12 ? 'PM' : 'AM'}`;
}

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
}) {
  const value = data[numberField] as string | undefined;
  const selected = fleet.find(vehicle => vehicle.id === value);
  const options: ComboboxOption[] = [...fleet]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(vehicle => ({ value: vehicle.id, label: vehicle.id, description: vehicle.type || vehicle.fleetType }));

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
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">calendar_month</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">Pull-out date</span><span className="dart-vehicle-value dart-tabular">{fmtDate(selected.pulloutDate)}</span></div>
              </div>
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">schedule</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">Pull-out time</span><span className="dart-vehicle-value dart-tabular">{fmtTime(selected.pulloutTime)}</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ marginTop: selected ? 26 : undefined }} className="max-w-xl">
        <Field label={label} required error={showErrors && !value}>
          <SearchableCombobox options={options} value={value || ''} onChange={handleChange} placeholder={placeholder} searchPlaceholder="Type vehicle number..." emptyMessage="No vehicles found" />
        </Field>
      </div>
    </>
  );
}
