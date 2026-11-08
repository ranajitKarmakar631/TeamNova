import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { loginApi } from "../api/auth.api";
import { LoginResponseType, loginType } from "../types/auth.types";
import { authKeys } from "../auth.keys";
import { CustomError } from "@/lib/api-error";

export const useLoginMutation = (
  options?: UseMutationOptions<LoginResponseType, CustomError, loginType>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: authKeys.authUser });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

