export type AssetStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AssetMetadata {
  creatorId: string;
  version: string;
}
