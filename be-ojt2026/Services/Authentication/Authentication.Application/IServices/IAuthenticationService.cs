using Authentication.Application.DTOs.Login;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IServices
{
    public interface IAuthenticationService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task SendOtpAsync(ForgotPasswordRequest request);
        Task<VerifyOtpResponse> VerifyOtpAsync(VerifyOtpRequest request);
        Task ResetPasswordAsync(ResetPasswordRequest request);
        Task<RegisterResponse> RegisterAsync(RegisterRequest request);
        Task SendEmailVerificationAsync(string email);
        Task<VerifyEmailResponse> VerifyEmailAsync(VerifyEmailRequest request);
    }
}
