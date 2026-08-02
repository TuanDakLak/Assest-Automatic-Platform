// Custom validators for the notebooklm module
export function isValidNotebooklmName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
