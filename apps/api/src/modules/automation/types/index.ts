export type AutomationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AutomationMetadata {
  creatorId: string;
  version: string;
}
