export type SettingsStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface SettingsMetadata {
  creatorId: string;
  version: string;
}
