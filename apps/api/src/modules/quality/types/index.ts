export type QualityStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface QualityMetadata {
  creatorId: string;
  version: string;
}
