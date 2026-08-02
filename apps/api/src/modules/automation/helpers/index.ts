// Helper tools for the automation module
export function formatAutomationResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
