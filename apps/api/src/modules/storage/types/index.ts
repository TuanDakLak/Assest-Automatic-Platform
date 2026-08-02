export type StorageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface StorageMetadata {
  creatorId: string;
  version: string;
}
