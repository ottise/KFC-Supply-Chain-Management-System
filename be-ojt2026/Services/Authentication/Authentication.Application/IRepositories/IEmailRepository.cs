using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IRepositories
{
    public interface IEmailRepository
    {
        Task<string?> GetForgotPasswordTemplate(string email, string to, string otp);
        Task<string?> GetPasswordChangedTemplate(string email, string to);
        Task<string?> GetEmailVerificationTemplate(string email, string to, string otp, string? password = null);
    }
}
