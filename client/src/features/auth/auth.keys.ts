export const authKeys = {
  all: ["auth"] as const,
  user: () => ["authUser"] as const,
  authUser: ["authUser"] as const,
};

