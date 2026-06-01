/**
 * The standard backend API response wrapper.
 * Every non-auth endpoint returns `{ isSuccess, data, message, errors }`.
 */
export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message: string;
  errors: string[] | null;
}

/**
 * Structured error thrown when `isSuccess === false`.
 * Carries the backend message and optional error detail list.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    message: string,
    public readonly errors: string[] | null = null,
  ) {
    super(message);
  }
}
