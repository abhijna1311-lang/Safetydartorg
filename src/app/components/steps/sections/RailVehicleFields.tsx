import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { FormField as Field } from '../../form/FormField';
import { LrvConsistFields } from './LrvConsistFields';
import type { AccidentReportData } from '../../../types/accident-report';

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const toOptions = (values: string[]) => values.map(value => ({ value, label: value }));

export const TRAIN_STATUS_OPTIONS = toOptions(['In Service', 'Deadhead', 'Pull in', 'Pull out', 'In Yard', 'Not In Service']);
export const RAIL_LINE_STATUSES = new Set(['In Service', 'Pull in', 'Pull out']);
const RAIL_LINE_OPTIONS = toOptions(['Blue', 'Green', 'Orange', 'Red']);
const LRV_BLOCK_OPTIONS = toOptions(['BLK-101', 'BLK-102', 'BLK-103', 'BLK-104', 'BLK-105']);

export const TRAIN_FLEET = [
  { id: 'T-2045', fleetType: 'KIN – Kinki Sharyo USA 1996', railLine: 'Blue', endOfLine: 'UNT Dallas', pulloutDate: '2026-07-24', pulloutTime: '05:10', cars: ['2101', '2102'] },
  { id: 'T-2088', fleetType: 'KIN – Kinki Sharyo USA 2005', railLine: 'Red', endOfLine: 'Westmoreland', pulloutDate: '2026-07-24', pulloutTime: '04:55', cars: ['2140'] },
  { id: 'T-3120', fleetType: 'KIN – Kinki Sharyo USA 2010', railLine: 'Green', endOfLine: 'Buckner', pulloutDate: '2026-07-24', pulloutTime: '06:02', cars: ['2201', '2202', '2203'] },
  { id: 'T-3345', fleetType: 'KIN – Kinki Sharyo USA 1999', railLine: 'Orange', endOfLine: 'DFW Airport', pulloutDate: '2026-07-24', pulloutTime: '05:40', cars: ['2118', '2119'] },
  { id: 'T-4210', fleetType: 'KIN – Kinki Sharyo USA 1998', railLine: 'Blue', endOfLine: 'Downtown Rowlett', pulloutDate: '2026-07-24', pulloutTime: '05:20', cars: ['2107', '2108', '2109', '2110'] },
];

export const STREETCAR_FLEET = [
  { id: 'SC-301', fleetType: 'Brookville Liberty Modern Streetcar', railLine: 'Streetcar', endOfLine: 'Bishop Arts', pulloutDate: '2026-07-24', pulloutTime: '05:30', cars: ['301'] },
  { id: 'SC-302', fleetType: 'Brookville Liberty Modern Streetcar', railLine: 'Streetcar', endOfLine: 'EBJ Union Station', pulloutDate: '2026-07-24', pulloutTime: '05:45', cars: ['302'] },
  { id: 'SC-303', fleetType: 'Brookville Liberty Modern Streetcar', railLine: 'Streetcar', endOfLine: 'Bishop Arts', pulloutDate: '2026-07-24', pulloutTime: '06:00', cars: ['303'] },
];

function fmtDate(iso?: string) {
  if (!iso) return undefined;
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${month}/${day}/${year}` : iso;
}

function fmtTime(value?: string) {
  if (!value) return undefined;
  const [hour, minute = '00'] = value.split(':');
  const hour24 = parseInt(hour, 10);
  if (Number.isNaN(hour24)) return value;
  return `${hour24 % 12 || 12}:${minute.padStart(2, '0')} ${hour24 >= 12 ? 'PM' : 'AM'}`;
}

export function TrainRecordCard({ data, showRailLine, showConsist, showCarNumber }: { data: AccidentReportData; showRailLine: boolean; showConsist: boolean; showCarNumber: boolean }) {
  const additional = [data.lrv_consist_2, data.lrv_consist_3, data.lrv_consist_4].filter(Boolean) as string[];
  const consistCars = data.train_number ? [data.train_number, ...additional] : additional;
  const consistTotal = data.lrv_consist_count ?? consistCars.length;
  const cols = [
    { label: 'Fleet type', value: data.lrv_fleet_type, glyph: 'tram' },
    ...(showCarNumber ? [{ label: 'Car number', value: data.car_number, glyph: 'confirmation_number' }] : []),
    { label: 'Trip ID', value: data.train_number, glyph: 'route' },
    { label: 'Pull-out date', value: fmtDate(data.train_pullout_date), glyph: 'calendar_month' },
    { label: 'Pull-out time', value: fmtTime(data.train_pullout_time), glyph: 'schedule' },
    { label: 'End of line destination', value: data.lrv_end_of_line, glyph: 'flag' },
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
      {showConsist && consistCars.length > 0 && (
        <div className="dart-vehicle-item">
          <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">train</span></span>
          <div className="dart-vehicle-text">
            <span className="dart-vehicle-label">Consist ({consistTotal})</span>
            <span className="dart-vehicle-value dart-tabular">
              {consistCars.map((car, index) => (
                <span key={car}>
                  <span className={car === data.train_number ? 'font-bold text-[#0078AE]' : undefined} title={car === data.train_number ? 'Lead LRV' : undefined}>{car}</span>
                  {index < consistCars.length - 1 && <span className="text-slate-300">, </span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type StatusField = 'train_status_before' | 'train_status_after' | 'vehicle_status_before' | 'vehicle_status_after';

interface RailVehicleFieldsProps {
  data: AccidentReportData;
  onUpdate: (data: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
  statusBeforeField?: StatusField;
  statusAfterField?: StatusField;
  statusBeforeOptions?: { value: string; label: string }[];
  statusAfterOptions?: { value: string; label: string }[];
  statusBeforeDisabled?: boolean;
  statusBeforePlaceholder?: string;
  showRailLine?: boolean;
  showStatusFields?: boolean;
  showVehicleDetails?: boolean;
  showConsist?: boolean;
  requiredVehicleNumber?: boolean;
}

export function RailVehicleFields({
  data,
  onUpdate,
  showErrors = false,
  statusBeforeField = 'train_status_before',
  statusAfterField = 'train_status_after',
  statusBeforeOptions = TRAIN_STATUS_OPTIONS,
  statusAfterOptions = TRAIN_STATUS_OPTIONS,
  statusBeforeDisabled = false,
  statusBeforePlaceholder = 'Select status',
  showRailLine = RAIL_LINE_STATUSES.has(data.train_status_before || ''),
  showStatusFields = true,
  showVehicleDetails = true,
  showConsist = true,
  requiredVehicleNumber = true,
}: RailVehicleFieldsProps) {
  const isStreetcar = data.mode === 'Streetcar';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const shouldShowRailLine = isLRV && showVehicleDetails && showRailLine;
  const activeFleet = isStreetcar ? STREETCAR_FLEET : TRAIN_FLEET;
  const trainOptions: ComboboxOption[] = [...activeFleet]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(train => ({ value: train.id, label: train.id, description: train.fleetType }));
  const selectedTrain = activeFleet.find(train => train.id === data.train_number);
  const hasTrainRecord = !!selectedTrain;
  const statusBefore = data[statusBeforeField] as string | undefined;
  const statusAfter = data[statusAfterField] as string | undefined;
  const requiredLrvBlock = isLRV && showVehicleDetails && requiredVehicleNumber;
  const requiredLrvRailLine = requiredLrvBlock && shouldShowRailLine;
  const updateStatus = (field: StatusField, value: string) => onUpdate({
    [field]: value,
    ...(isLRV && field === statusBeforeField && !RAIL_LINE_STATUSES.has(value) ? { rail_line: undefined } : {}),
  } as Partial<AccidentReportData>);

  const handleTrainChange = (value: string) => {
    const train = activeFleet.find(item => item.id === value);
    const cars = train?.cars ?? [];
    onUpdate({
      train_number: value,
      lrv_fleet_type: train?.fleetType,
      rail_line: train?.railLine,
      block_number: undefined,
      lrv_end_of_line: train?.endOfLine,
      train_pullout_date: train?.pulloutDate,
      train_pullout_time: train?.pulloutTime,
      lrv_consist_count: isStreetcar ? undefined : data.lrv_consist_count,
      lrv_consist_1: isStreetcar ? undefined : data.lrv_consist_1,
      lrv_consist_2: isStreetcar ? undefined : data.lrv_consist_2,
      lrv_consist_3: isStreetcar ? undefined : data.lrv_consist_3,
      lrv_consist_4: isStreetcar ? undefined : data.lrv_consist_4,
      car_number: isStreetcar ? cars[0] : undefined,
    });
  };

  return (
    <>
      <AnimatePresence>
        {showVehicleDetails && hasTrainRecord && (
          <motion.div {...fade} key="train-record">
            <TrainRecordCard data={data} showRailLine={showRailLine && !isStreetcar} showConsist={!isStreetcar} showCarNumber={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginTop: showVehicleDetails && hasTrainRecord ? 26 : undefined }} className={isLRV ? `grid grid-cols-1 gap-[18px] sm:grid-cols-2 ${shouldShowRailLine ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}` : showStatusFields ? 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-1 gap-[18px] sm:grid-cols-2'}>
        {showStatusFields && <Field label={isStreetcar ? 'Streetcar Status Before Event' : 'Train status before event'} required>
          <CustomSelect value={statusBefore || ''} onChange={value => updateStatus(statusBeforeField, value)} options={statusBeforeOptions} placeholder={statusBeforePlaceholder} disabled={statusBeforeDisabled} />
        </Field>}
        {showStatusFields && <Field label={isStreetcar ? 'Streetcar Status After Event' : 'Train status after event'} required>
          <CustomSelect value={statusAfter || ''} onChange={value => updateStatus(statusAfterField, value)} options={statusAfterOptions} placeholder="Select status" />
        </Field>}
        <Field label={isStreetcar ? 'Streetcar Number Involved in the Event' : 'LRV number involved in event'} required={requiredVehicleNumber} error={showErrors && requiredVehicleNumber && !data.train_number}>
          <SearchableCombobox
            options={trainOptions}
            value={data.train_number || ''}
            onChange={handleTrainChange}
            placeholder={isStreetcar ? 'Search streetcar #' : 'Search LRV #'}
            searchPlaceholder={isStreetcar ? 'Type streetcar number...' : 'Type LRV number...'}
            emptyMessage={isStreetcar ? 'No streetcars found' : 'No LRVs found'}
          />
        </Field>
        {isLRV && showVehicleDetails && <Field label="Block ID" required={requiredLrvBlock} error={showErrors && requiredLrvBlock && !data.block_number}>
          <CustomSelect value={data.block_number || ''} onChange={value => onUpdate({ block_number: value })} options={LRV_BLOCK_OPTIONS} placeholder="Select block" />
        </Field>}
        {shouldShowRailLine && <Field label="Rail Line" required={requiredLrvRailLine} error={showErrors && requiredLrvRailLine && !data.rail_line}>
          <CustomSelect value={data.rail_line || ''} onChange={value => onUpdate({ rail_line: value })} options={RAIL_LINE_OPTIONS} placeholder="Select line" />
        </Field>}
      </div>

      {!isStreetcar && showConsist && <LrvConsistFields data={data} onUpdate={onUpdate} showErrors={showErrors} />}
    </>
  );
}
