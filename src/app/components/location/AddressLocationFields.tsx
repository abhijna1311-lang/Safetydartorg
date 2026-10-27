import type { AccidentReportData } from '../../types/accident-report';
import { FormField } from '../form/FormField';
import { LocationPicker } from './LocationPicker';
import {
  OPERATOR_LOCATION,
  readAutofilled,
  readRole,
  roleKey,
  writeRole,
  type AddressRole,
  type LocationFieldConfig,
} from './locationFields';

interface AddressLocationFieldsProps {
  data: AccidentReportData;
  onUpdate: (patch: Partial<AccidentReportData>) => void;
  /** Which report fields to read and write. Defaults to the operator's event location. */
  config?: LocationFieldConfig;
  showErrors?: boolean;
  /** Mark the fields required (shows the asterisk). Errors only show when `showErrors` is set. */
  required?: boolean;
  /** Narrow which fields are required, e.g. ['street', 'city']. Defaults to all when `required`. */
  requiredRoles?: AddressRole[];
  /** Label for single-field configs (`streetAsFullAddress`). */
  singleFieldLabel?: string;
}

const ROLE_META: Record<AddressRole, { label: string; placeholder: string }> = {
  street: { label: 'Street On', placeholder: 'e.g. Main St' },
  cross: { label: 'Cross Street', placeholder: 'e.g. Elm Ave' },
  city: { label: 'City', placeholder: 'e.g. Dallas' },
  zip: { label: 'ZIP Code', placeholder: 'e.g. 75201' },
};

/**
 * The standard "where it happened" address block: map pin + Street On / Cross Street / City / ZIP.
 * Use this anywhere the app asks for an event address so every role gets the same map behavior.
 */
export function AddressLocationFields({
  data,
  onUpdate,
  config = OPERATOR_LOCATION,
  showErrors = false,
  required = true,
  requiredRoles,
  singleFieldLabel = 'Event location',
}: AddressLocationFieldsProps) {
  const isRequired = (role: AddressRole) => required && (!requiredRoles || requiredRoles.includes(role));
  const autofilled = readAutofilled(data, config);
  const roles: AddressRole[] = (['street', 'cross', 'city', 'zip'] as const).filter((role) => roleKey(config, role));

  // A hand edit takes the field out of map control so a later re-pin won't overwrite it.
  const update = (role: AddressRole, raw: string) => {
    const value = role === 'zip' ? raw.replace(/\D/g, '').slice(0, 5) : raw;
    onUpdate({
      ...writeRole(config, role, value),
      ...(autofilled.includes(role) ? { [config.autofilled]: autofilled.filter((r) => r !== role) } : {}),
    } as Partial<AccidentReportData>);
  };

  const fromMapTag = (role: AddressRole) =>
    autofilled.includes(role) && readRole(data, config, role) ? (
      <span className="ml-2 inline-flex items-center rounded-full bg-dart-selected px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-dart-navy">
        From map
      </span>
    ) : null;

  return (
    <LocationPicker data={data} onUpdate={onUpdate} config={config}>
      {(layout) => (
        <div className={`grid grid-cols-1 gap-4 ${roles.length > 1 ? (layout === 'panel' ? 'sm:grid-cols-2' : 'md:grid-cols-4') : ''}`}>
          {roles.map((role) => {
            const value = readRole(data, config, role);
            const meta = config.streetAsFullAddress
              ? { label: singleFieldLabel, placeholder: 'Search above, pin the map, or type the location' }
              : ROLE_META[role];
            return (
              <FormField
                key={role}
                label={meta.label}
                required={isRequired(role)}
                error={showErrors && isRequired(role) && !value.trim()}
                labelAdornment={fromMapTag(role)}
              >
                <input
                  type="text"
                  value={value}
                  onChange={(e) => update(role, e.target.value)}
                  placeholder={meta.placeholder}
                  className="dart-input-base"
                  {...(role === 'zip' ? { inputMode: 'numeric' as const, maxLength: 5 } : {})}
                />
              </FormField>
            );
          })}
        </div>
      )}
    </LocationPicker>
  );
}
