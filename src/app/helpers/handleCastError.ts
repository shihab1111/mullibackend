/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose from "mongoose"
export interface TGenericErrorResponse {
  statusCode: number;   // HTTP status code, e.g., 400, 500
  message: string;      // Human-readable error message
  errors?: any;         // Optional: additional error info (like validation errors)
  success?: boolean;    // Optional: flag for success/failure
}

export const handleCastError = (err: mongoose.Error.CastError): TGenericErrorResponse => {
    return {
        statusCode: 400,
        message: "Invalid MongoDB ObjectID. Please provide a valid id"
    }
}