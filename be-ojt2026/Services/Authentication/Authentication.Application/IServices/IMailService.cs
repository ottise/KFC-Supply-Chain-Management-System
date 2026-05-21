using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IServices
{
    public interface IMailService
    {
        Task SendOtpMailAsync(string toEmail, string otp);
        Task SendPasswordChangedMailAsync(string toEmail);
        Task SendEmailVerificationMailAsync(string toEmail, string otp, string? password = null);
    }
}
