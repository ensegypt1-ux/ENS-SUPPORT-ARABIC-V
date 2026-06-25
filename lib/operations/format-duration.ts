/** Client-safe duration formatter for operations dashboards. */
export function formatOperationsDuration(minutes: number) {
  if (minutes <= 0) return "0 د";
  if (minutes < 60) return `${Math.round(minutes)} د`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = Math.round(minutes % 60);
  return remMinutes > 0 ? `${hours} س ${remMinutes} د` : `${hours} س`;
}
