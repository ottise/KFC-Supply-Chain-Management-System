// Login request payload
export interface LoginRequest {
  EmailOrUsername: string;
  Password: string;
}

// User information from token/API response
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  fullname?: string;
  phone?: string;
  role: UserRole;
  managerId?: string | null;
  isEmailVerified?: boolean;
  [key: string]: unknown;
}

// JWT Token payload
export interface JwtPayload {
  sub: string;
  email: string;
  username?: string;
  role: UserRole;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

// User roles
export type UserRole = 'warehouse_staff' | 'warehouse_manager' | 'admin' | 'Manager' | 'Staff';

// Login API response
export interface LoginResponse {
  token: string;
  user: UserInfo;
  message?: string;
}

// Auth state
export interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthReady: boolean;
}

// Protected routes by role
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/warehouse-staff': ['warehouse_staff', 'admin', 'Staff'],
  '/warehouse_manager': ['warehouse_manager', 'admin', 'Manager'],
  '/admin': ['admin'],
};

// Register request payload
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullname: string;
  phone: string;
}

// Register API response
export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  fullname: string;
  phone: string;
  role: string;
}

// Forgot Password request payload
export interface ForgotPasswordRequest {
  email: string;
}

// Forgot Password API response
export interface ForgotPasswordResponse {
  message: string;
}

// Reset Password request payload
export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

// Reset Password API response
export interface ResetPasswordResponse {
  message: string;
}

// Verify OTP request payload
export interface VerifyOtpRequest {
  otpCode: string;
}

// Verify OTP API response
export interface VerifyOtpResponse {
  valid: boolean;
  message: string;
}

// Send Verification Email request payload
export interface SendVerificationEmailRequest {
  email: string;
}

// Send Verification Email API response
export interface SendVerificationEmailResponse {
  message: string;
}

// Verify Email request payload
export interface VerifyEmailRequest {
  email: string;
  otpCode: string;
}

// Verify Email API response
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}
