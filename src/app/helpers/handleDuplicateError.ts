export interface TGenericErrorResponse {
  statusCode: number;   // HTTP status code, e.g., 400, 500
  message: string;      // Human-readable error message
  errors?: any;         // Optional: additional error info (like validation errors)
  success?: boolean;    // Optional: flag for success/failure
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handlerDuplicateError = (err: any): TGenericErrorResponse => {

    const field = Object.keys(err.keyValue || {})[0]
    const value = err.keyValue?.[field]

    return {
        statusCode: 400,
        message: `${field}: ${value} already exists`
    }
}