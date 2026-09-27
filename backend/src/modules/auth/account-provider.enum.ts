export const ProviderEnum = {
  EMAIL: "EMAIL",
} as const;

export type ProviderEnumType = keyof typeof ProviderEnum;
