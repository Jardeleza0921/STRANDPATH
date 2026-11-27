export class ApiError extends Error {
  status: number;
  code: string;
  missing?: string[];

  constructor(status: number, code: string, message: string, missing?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.missing = missing;
  }
}
