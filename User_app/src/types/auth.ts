// src/types/auth.ts

export type AuthUser = {
  id: string;
  phone: string;
  name?: string;
  avatar?: string;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};
