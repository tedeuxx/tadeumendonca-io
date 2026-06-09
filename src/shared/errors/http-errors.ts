// Throw these — never return 4xx from handlers (/backend/error-handling). The Hono onError maps them
// to an HTTP response with a snake_case body. AppError carries the status + a stable error code.

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'resource not found') {
    super(404, 'not_found', message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'unauthorized') {
    super(403, 'unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'bad request') {
    super(400, 'bad_request', message);
    this.name = 'BadRequestError';
  }
}
