// Helper tools for the jobs module
export function formatJobsResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
