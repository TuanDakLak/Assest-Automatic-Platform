// Custom validators for the prompt module
export function isValidPromptName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}
