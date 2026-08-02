// Helper tools for the prompt module
export function formatPromptResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
