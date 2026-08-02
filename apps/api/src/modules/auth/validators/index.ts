// Custom validators for the auth module
export function isValidAuthName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
