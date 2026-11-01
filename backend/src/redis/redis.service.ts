
import Redis from "ioredis";

class RedisService {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = new Redis({
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
      });

      RedisService.instance.on("error", (err: Error) => {
        console.error("Redis error:", err.message);
      });

      RedisService.instance.on('connect' ,()=>console.log("Redis connected"))
    }

    return RedisService.instance;
  }
}

export const redis = RedisService.getInstance();
