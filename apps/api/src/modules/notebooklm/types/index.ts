export type NotebooklmStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface NotebooklmMetadata {
  creatorId: string;
  version: string;
}
