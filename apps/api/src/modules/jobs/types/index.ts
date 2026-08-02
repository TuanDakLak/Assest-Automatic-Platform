export type JobsStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface JobsMetadata {
  creatorId: string;
  version: string;
}
