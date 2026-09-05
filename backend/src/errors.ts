export type NegotiationErrorCode =
  | 'JOB_TAKEN' | 'NOT_FOUND' | 'NOT_OPEN' | 'ALREADY_NEGOTIATING'
  | 'NOT_PARTICIPANT' | 'ALREADY_CLOSED' | 'STALE' | 'BAD_REQUEST'
  | 'UNAUTHORIZED' | 'INTERNAL';

export class NegotiationError extends Error {
  constructor(public readonly code: NegotiationErrorCode, message: string) {
    super(message);
    this.name = 'NegotiationError';
  }
}
