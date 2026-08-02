// Helper tools for the notebooklm module
export function formatNotebooklmResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
