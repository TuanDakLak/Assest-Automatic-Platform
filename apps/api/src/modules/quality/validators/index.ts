// Custom validators for the quality module
export function isValidQualityName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
