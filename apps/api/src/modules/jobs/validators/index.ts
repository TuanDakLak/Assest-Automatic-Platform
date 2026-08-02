// Custom validators for the jobs module
export function isValidJobsName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
