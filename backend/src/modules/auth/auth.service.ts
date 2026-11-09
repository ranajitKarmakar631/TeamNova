import mongoose from "mongoose";
import UserModel from "../user/user.model";
import AccountModel from "./account.model";
import WorkspaceModel from "../workspace/workspace.model";
import RoleModel from "../member/role-permission.model";
import { Roles } from "../../common/enums/role.enum";
import { ProviderEnum } from "./account-provider.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/appError";
import { MemberModel } from "../member";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";

export const registerUserService = async (body: {
  email: string;
  name: string;
  password: string;
}) => {
  const { email, name, password } = body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new BadRequestException("Email already exists");
  }

  const user = new UserModel({
    email,
    name,
    password,
  });
  await user.save();

  // const ownerRole = await RoleModel.findOne({
  //   name: Roles.OWNER,
  // });

  // if (!ownerRole) {
  //   throw new NotFoundException("Owner role not found");
  // }

  // const member = new MemberModel({
  //   userId: user._id,
  //   role: ownerRole._id,
  //   joinedAt: new Date(),
  // });
  // await member.save();

  const accessToken = signAccessToken({ userId: user._id.toString() });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  const account = new AccountModel({
    userId: user._id,
    provider: ProviderEnum.EMAIL,
    providerId: email,
    refreshToken,
    tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await account.save();

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const verifyUserService = async ({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  provider?: string;
}) => {
  const account = await AccountModel.findOne({ provider, providerId: email });
  if (!account) {
    throw new NotFoundException("Invalid email or password");
  }

  const user = await UserModel.findById(account.userId);

  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedException("Invalid email or password");
  }

  return user.omitPassword();
};

export const loginUserService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = await verifyUserService({ email, password });

  const accessToken = signAccessToken({ userId: user._id.toString() });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  await AccountModel.findOneAndUpdate(
    { userId: user._id, provider: ProviderEnum.EMAIL },
    {
      refreshToken,
      tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new UnauthorizedException("Refresh token is required");
  }

  const decoded = verifyRefreshToken(refreshToken);

  const account = await AccountModel.findOne({
    userId: decoded.userId,
    refreshToken,
  });

  if (!account) {
    throw new UnauthorizedException("Invalid or revoked refresh token");
  }

  if (account.tokenExpiry && account.tokenExpiry < new Date()) {
    throw new UnauthorizedException("Refresh token expired");
  }

  const user = await UserModel.findById(decoded.userId);
  if (!user) {
    throw new UnauthorizedException("User not found");
  }

  // Issue new access token and rotate refresh token
  const newAccessToken = signAccessToken({ userId: user._id.toString() });
  const newRefreshToken = signRefreshToken({ userId: user._id.toString() });

  account.refreshToken = newRefreshToken;
  account.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await account.save();

  return {
    user: user.omitPassword(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

import { deleteCache } from "../../redis/redis.service";
import { REDIS_KEYS } from "../../redis/redis.keys";

export const logoutUserService = async ({
  refreshToken,
  userId,
}: {
  refreshToken?: string;
  userId?: string;
}) => {
  if (refreshToken) {
    const account = await AccountModel.findOneAndUpdate(
      { refreshToken },
      { refreshToken: null, tokenExpiry: null }
    );
    if (account?.userId) {
      await deleteCache(
        REDIS_KEYS.USER_SESSION(account.userId.toString()),
        REDIS_KEYS.USER_PROFILE(account.userId.toString())
      );
    }
  } else if (userId) {
    await AccountModel.updateOne(
      { userId, provider: ProviderEnum.EMAIL },
      { refreshToken: null, tokenExpiry: null }
    );
    await deleteCache(
      REDIS_KEYS.USER_SESSION(userId),
      REDIS_KEYS.USER_PROFILE(userId)
    );
  }
};
