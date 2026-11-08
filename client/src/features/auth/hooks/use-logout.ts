import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { logoutApi } from "../api/auth.api";
import { CustomError } from "@/lib/api-error";

export const useLogoutMutation = (
  options?: UseMutationOptions<unknown, CustomError, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.clear();
      options?.onSuccess?.(data, variables, context);
    },
  });
};

