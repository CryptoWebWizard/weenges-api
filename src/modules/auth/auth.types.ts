export interface User {
  id: number;
  email: string;
  password: string;
  created_at: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export interface RefreshDto {
  refreshToken: string;
}
