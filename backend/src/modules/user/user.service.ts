import UserModel from "./user.model";
import { BadRequestException } from "../../common/utils/appError";
import { getJsonCache, setJsonCache } from "../../redis/redis.service";
import { REDIS_KEYS, REDIS_TTL } from "../../redis/redis.keys";

export const getCurrentUserService = async (userId: string) => {
  const cacheKey = REDIS_KEYS.USER_PROFILE(userId);
  const cached = await getJsonCache<any>(cacheKey);
  if (cached) {
    return {
      user: cached,
    };
  }

  const user = await UserModel.findById(userId)
    .populate("currentWorkspace")
    .select("-password")
    .lean();

  if (!user) {
    throw new BadRequestException("User not found");
  }

  await setJsonCache(cacheKey, user, REDIS_TTL.PROFILE);

  return {
    user,
  };
};
