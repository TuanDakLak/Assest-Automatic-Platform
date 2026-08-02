export type AuthStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AuthMetadata {
  creatorId: string;
  version: string;
}
