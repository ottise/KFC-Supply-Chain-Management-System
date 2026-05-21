using Authentication.Application.IRepositories;
using Authentication.Domain.Entities;
using Authentication.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Authentication.Infrastructure.Repositories
{
    public class EmailVerificationRepository : IEmailVerificationRepository
    {
        private readonly AuthenticationDbContext _context;
        public EmailVerificationRepository(AuthenticationDbContext context) 
        {
            _context = context;
        }

        public async Task CreateTokenAsync(EmailVerificationToken token)
        {
            _context.EmailVerificationTokens.Add(token);
        }

        public async Task<EmailVerificationToken?> GetValidTokenAsync(int userId, string otpCode)
        {
            return await _context.EmailVerificationTokens
                .FirstOrDefaultAsync(x => x.UserId == userId
                                    && x.OtpCode == otpCode
                                    && !x.IsUsed
                                    && x.ExpirationTime > DateTime.UtcNow);
        }

        public async Task MarkAsUsedAsync(EmailVerificationToken token)
        {
            token.IsUsed = true;
        }
    }
}
