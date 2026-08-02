export type DashboardStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface DashboardMetadata {
  creatorId: string;
  version: string;
}
