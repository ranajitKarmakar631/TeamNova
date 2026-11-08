import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { registerApi } from "../api/auth.api";
import { registerType } from "../types/auth.types";
import { CustomError } from "@/lib/api-error";

export const useRegisterMutation = (
  options?: UseMutationOptions<unknown, CustomError, registerType>
) => {
  return useMutation({
    mutationFn: registerApi,
    ...options,
  });
};

