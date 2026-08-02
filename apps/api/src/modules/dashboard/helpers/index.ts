// Helper tools for the dashboard module
export function formatDashboardResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
