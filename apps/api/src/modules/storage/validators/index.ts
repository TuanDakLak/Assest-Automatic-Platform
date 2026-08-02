// Custom validators for the storage module
export function isValidStorageName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
