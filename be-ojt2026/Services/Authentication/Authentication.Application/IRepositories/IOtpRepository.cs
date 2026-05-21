using Authentication.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IRepositories
{
    public interface IOtpRepository
    {
        Task CreateOtpAsync(PasswordResetToken token);
        Task<PasswordResetToken?> GetValidTokenAsync(int userId, string otpCode);
        Task MarkAsUsedAsync(PasswordResetToken token);
        Task<PasswordResetToken?> GetValidOtpAsync(string otpCode);
    }
}
