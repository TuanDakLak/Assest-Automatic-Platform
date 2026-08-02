// Custom validators for the market module
export function isValidMarketName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
