// Custom validators for the dashboard module
export function isValidDashboardName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
