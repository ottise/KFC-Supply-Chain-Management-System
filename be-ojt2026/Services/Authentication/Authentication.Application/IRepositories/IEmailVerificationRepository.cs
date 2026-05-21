using Authentication.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IRepositories
{
    public interface IEmailVerificationRepository
    {
        Task CreateTokenAsync(EmailVerificationToken token);
        Task<EmailVerificationToken?> GetValidTokenAsync(int userId, string otpCode);
        Task MarkAsUsedAsync(EmailVerificationToken token);
    }
}
