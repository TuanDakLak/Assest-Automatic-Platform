// Custom validators for the settings module
export function isValidSettingsName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
