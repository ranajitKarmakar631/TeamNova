import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getCurrentUserApi } from "../api/auth.api";
import { CurrentUserResponseType } from "../types/auth.types";
import { authKeys } from "../auth.keys";
import { CustomError } from "@/lib/api-error";

export const useAuthUserQuery = (
  options?: Omit<UseQueryOptions<CurrentUserResponseType, CustomError>, "queryKey" | "queryFn">
) => {
  return useQuery<CurrentUserResponseType, CustomError>({
    queryKey: authKeys.authUser,
    queryFn: getCurrentUserApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (
        error?.response?.status === 401 ||
        error?.status === 401 ||
        error?.statusCode === 401
      ) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

export const useAuth = useAuthUserQuery;
export default useAuthUserQuery;

