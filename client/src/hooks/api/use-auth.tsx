import { getCurrentUserQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: getCurrentUserQueryFn,
    staleTime: 0,
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
  });
  return query;
};

export default useAuth;
