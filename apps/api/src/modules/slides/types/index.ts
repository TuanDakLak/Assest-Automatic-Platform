export type SlidesStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface SlidesMetadata {
  creatorId: string;
  version: string;
}
