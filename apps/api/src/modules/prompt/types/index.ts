export type PromptStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface PromptMetadata {
  creatorId: string;
  version: string;
}
