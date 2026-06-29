const WEEKDAYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Formats an ISO timestamp as the weekday followed by the date,
 * e.g. "miércoles 24/06/2026". Uses UTC so the rendered weekday and
 * date stay consistent with the stored shift date regardless of the
 * viewer's local timezone.
 */
export function formatShiftDateLabel(iso: string): string {
  const d = new Date(iso);
  const weekday = WEEKDAYS_ES[d.getUTCDay()];
  const day = pad2(d.getUTCDate());
  const month = pad2(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  return `${weekday} ${day}/${month}/${year}`;
}

/**
 * Formats an ISO timestamp as HH:mm (24h) in UTC, matching the way
 * shift start/end times are stored.
 */
export function formatShiftTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}
