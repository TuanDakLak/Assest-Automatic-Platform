export type ResearchStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ResearchMetadata {
  creatorId: string;
  version: string;
}
