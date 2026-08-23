// Standard error shape so controllers never leak stack traces or internal
// details to the frontend. Always throw ApiError for expected failure cases
// (insufficient balance, invalid input, unauthorized, etc.)
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
