using Authentication.Application.IRepositories;
using Authentication.Domain.Entities;
using Authentication.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Infrastructure.Repositories
{
    public class OtpRepository : IOtpRepository
    {
        private readonly AuthenticationDbContext _context;
        public OtpRepository(AuthenticationDbContext context)
        {
            _context = context;
        }
        public async Task CreateOtpAsync(PasswordResetToken token)
        {
            _context.PasswordResetTokens.Add(token);
            await _context.SaveChangesAsync();
        }

        public async Task<PasswordResetToken?> GetValidOtpAsync(string otpCode)
        {
            return await _context.PasswordResetTokens
                .FirstOrDefaultAsync(x => x.OtpCode == otpCode
                                         && !x.IsUsed
                                         && x.ExpirationTime > DateTime.UtcNow);
        }

        public async Task<PasswordResetToken?> GetValidTokenAsync(int userId, string otpCode)
        {
            return await _context.PasswordResetTokens
              .FirstOrDefaultAsync(x => x.UserId == userId
                                       && x.OtpCode == otpCode
                                       && !x.IsUsed
                                       && x.ExpirationTime > DateTime.UtcNow);
        }

        public async Task MarkAsUsedAsync(PasswordResetToken token)
        {
            token.IsUsed = true;
            await _context.SaveChangesAsync();
        }

    }
}
