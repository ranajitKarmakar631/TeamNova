import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import { loginSchema, registerSchema } from "./auth.validation";
import { HTTPSTATUS } from "../../config/http.config";
import {
  loginUserService,
  logoutUserService,
  refreshTokenService,
  registerUserService,
} from "./auth.service";
import { clearAuthCookies, setAuthCookies } from "../../common/utils/jwt";

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("This is you body", req.body);
    const body = registerSchema.parse({
      ...req.body,
    });

    const result = await registerUserService(body);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = loginSchema.parse({
      ...req.body,
    });

    const result = await loginUserService(body);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged in successfully",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      (req.headers["x-refresh-token"] as string);

    const result = await refreshTokenService(refreshToken);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(HTTPSTATUS.OK).json({
      message: "Access token refreshed successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }
);

export const logOutController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      (req.headers["x-refresh-token"] as string);

    await logoutUserService({
      refreshToken,
      userId: req.user?._id?.toString(),
    });

    clearAuthCookies(res);

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged out successfully",
    });
  }
);
