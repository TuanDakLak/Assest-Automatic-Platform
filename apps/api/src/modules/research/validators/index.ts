// Custom validators for the research module
export function isValidResearchName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
