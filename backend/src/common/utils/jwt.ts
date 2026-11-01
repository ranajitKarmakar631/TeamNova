import jwt, { SignOptions } from "jsonwebtoken";
import { Response } from "express";
import { config } from "../../config/app.config";
import { UnauthorizedException } from "./appError";

export interface AccessTokenPayload {
  userId: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const signAccessToken = (
  payload: AccessTokenPayload,
  options?: SignOptions
): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as any,
    ...options,
  });
};

export const signRefreshToken = (
  payload: RefreshTokenPayload,
  options?: SignOptions
): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
    ...options,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (error: any) {
    throw new UnauthorizedException(
      error?.name === "TokenExpiredError"
        ? "Access token has expired"
        : "Invalid access token"
    );
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error: any) {
    throw new UnauthorizedException(
      error?.name === "TokenExpiredError"
        ? "Refresh token has expired"
        : "Invalid refresh token"
    );
  }
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  const isProduction = config.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

export const clearAuthCookies = (res: Response): void => {
  const isProduction = config.NODE_ENV === "production";

  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
  };

  res.clearCookie("accessToken", clearOptions);
  res.clearCookie("refreshToken", clearOptions);
};
