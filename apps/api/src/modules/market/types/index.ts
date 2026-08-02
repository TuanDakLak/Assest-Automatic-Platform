export type MarketStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface MarketMetadata {
  creatorId: string;
  version: string;
}
