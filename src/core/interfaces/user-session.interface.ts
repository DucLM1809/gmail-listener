export interface UserSession {
  userId: string;
  email: string;
  role?: number;
  sub?: string; // For compatibility with RefreshTokenStrategy payload
  refreshToken?: string; // For RefreshTokenStrategy
  isTwoFactorAuthenticated?: boolean;
  type?: string;
}
