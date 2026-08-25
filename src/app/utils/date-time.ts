export function isFutureDateTime(dateValue?: string, timeValue?: string, now = new Date()): boolean {
  if (!dateValue || !timeValue) return false;
  const dateTime = new Date(`${dateValue}T${timeValue}:00`);
  return !Number.isNaN(dateTime.getTime()) && dateTime.getTime() > now.getTime();
}
