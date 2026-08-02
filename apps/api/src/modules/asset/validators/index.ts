// Custom validators for the asset module
export function isValidAssetName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
