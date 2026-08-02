// Helper tools for the settings module
export function formatSettingsResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
