import type { ReactNode } from 'react';

/**
 * Shared field wrapper for required-field validation across the accident-report flow.
 *
 * Renders:
 * - Label with optional required marker
 * - The input (children), wrapped in an inset red border when `error` is true
 * - Below: red "<label> is required." when `error`, else optional `helper` hint
 *
 * Use this ONE component wherever a required field lives so validation UI stays
 * identical across roles, screens, and sub-steps.
 */
export function FormField({
  label,
  required,
  helper,
  error,
  labelAdornment,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  error?: boolean;
  /** Small inline tag after the label, e.g. "From map". */
  labelAdornment?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="dart-field-label">
        {label}
        {required && <span className="dart-req ml-1">*</span>}
        {labelAdornment}
      </label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-slate-500 font-['Poppins']">{helper}</p>
      ) : null}
    </div>
  );
}
