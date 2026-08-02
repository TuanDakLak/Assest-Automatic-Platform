// Helper tools for the slides module
export function formatSlidesResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
