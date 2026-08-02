// Custom validators for the slides module
export function isValidSlidesName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
