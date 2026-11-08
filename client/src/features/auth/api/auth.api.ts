import API from "@/lib/axios-client";
import {
  CurrentUserResponseType,
  LoginResponseType,
  loginType,
  registerType,
} from "../types/auth.types";

export const loginApi = async (data: loginType): Promise<LoginResponseType> => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const registerApi = async (data: registerType) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const logoutApi = async () => {
  const response = await API.post("/auth/logout");
  return response.data;
};

export const refreshTokenApi = async () => {
  const response = await API.post("/auth/refresh");
  return response.data;
};

export const getCurrentUserApi = async (): Promise<CurrentUserResponseType> => {
  const response = await API.get("/user/current");
  return response.data;
};

