import { AxiosError } from "axios";

export interface CustomError extends Error {
  errorCode?: string;
  response?: AxiosError["response"];
  status?: number;
  statusCode?: number;
}

export const getErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred"
): string => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  const err = error as any;
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
};

export const getErrorCode = (error: unknown): string => {
  const err = error as any;
  return err?.errorCode || err?.response?.data?.errorCode || "UNKNOWN_ERROR";
};

