
export interface APIErrorConstructor {
  status: number
  code: number
  message: string
  retry: number | boolean
}

export class APIError extends Error {
  status?: number
  code?: number
  retry?: number | boolean
  constructor({ status, code, message, retry }: Partial<APIErrorConstructor>) {
    super(message);

    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.retry = retry;
  }
}

export class RequestTimeOutError extends APIError {
  constructor(message: string) {
    super({ code: 1, message });
    this.name = 'RequestTimeOutError';
  }
}

export function isCancelError(error?: Error) {
  return error?.name === 'AbortError';
}
