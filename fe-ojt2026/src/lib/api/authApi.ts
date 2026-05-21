import apiClient from '@/lib/axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse, VerifyOtpRequest, VerifyOtpResponse, SendVerificationEmailRequest, SendVerificationEmailResponse, VerifyEmailRequest, VerifyEmailResponse, UserInfo } from '@/types/auth';
import { storeToken, storeUserInfo, getUserFromToken, clearAuthData } from '@/lib/utils/authUtils';

const API_PREFIX = '/api/v1/auth';

export const authService = {
  // Login with email/username and password
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(`${API_PREFIX}/Auth/login`, credentials);

    // Store token in cookie
    storeToken(data.token);

    // Store user info from API response (more reliable than parsing JWT)
    if (data.user) {
      storeUserInfo(data.user);
    } else {
      // Fallback: extract user from JWT token
      const userInfo = getUserFromToken(data.token);
      if (userInfo) {
        storeUserInfo(userInfo);
      }
    }

    return data;
  },

  // Logout - clear auth data locally (no API call needed)
  logout: (): void => {
    clearAuthData();
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>(`${API_PREFIX}/Auth/register`, userData);
    return data;
  },

  // Forgot password - send OTP to email
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const { data } = await apiClient.post<ForgotPasswordResponse>(
      `${API_PREFIX}/Auth/forgot-password`,
      { email }
    );
    return data;
  },

  // Verify OTP
  verifyOtp: async (otpData: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const { data } = await apiClient.post<VerifyOtpResponse>(
      `${API_PREFIX}/Auth/verify-otp`,
      otpData
    );
    return data;
  },

  // Reset password with OTP
  resetPassword: async (resetData: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const { data } = await apiClient.post<ResetPasswordResponse>(
      `${API_PREFIX}/Auth/reset-password/otp`,
      resetData
    );
    return data;
  },

  // Get current user profile
  getCurrentProfile: async (): Promise<UserInfo> => {
    const { data } = await apiClient.get<UserInfo>(`${API_PREFIX}/Auth/current-profile`);
    return data;
  },

  // Send verification email
  sendVerificationEmail: async (email: string): Promise<SendVerificationEmailResponse> => {
    const { data } = await apiClient.post<SendVerificationEmailResponse>(
      `${API_PREFIX}/Auth/send-verification-email`,
      { email }
    );
    return data;
  },

  // Verify email with code
  verifyEmail: async (verifyData: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
    const { data } = await apiClient.post<VerifyEmailResponse>(
      `${API_PREFIX}/Auth/verify-email`,
      verifyData
    );
    return data;
  },
};

export default authService;
