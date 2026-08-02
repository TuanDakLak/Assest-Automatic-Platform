// Custom validators for the automation module
export function isValidAutomationName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
