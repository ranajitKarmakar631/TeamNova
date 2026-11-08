import { CustomError } from "./api-error";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const options = {
  baseURL,
  withCredentials: true,
  timeout: 10000,
};

const API = axios.create(options);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    const response = error?.response;

    if (response?.status === 401 && !originalRequest?._retry) {
      const isAuthUrl =
        originalRequest?.url?.includes("/auth/login") ||
        originalRequest?.url?.includes("/auth/register") ||
        originalRequest?.url?.includes("/auth/refresh");

      if (!isAuthUrl) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => API(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          processQueue(null);
          return API(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);

          // Prevent infinite reload loop: only redirect if not already on an auth page
          const isAuthPage =
            window.location.pathname === "/" ||
            window.location.pathname.startsWith("/sign-up") ||
            window.location.pathname.startsWith("/google/oauth");

          if (!isAuthPage) {
            window.location.href = "/";
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    const customError: CustomError = {
      ...error,
      errorCode: response?.data?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

export default API;
