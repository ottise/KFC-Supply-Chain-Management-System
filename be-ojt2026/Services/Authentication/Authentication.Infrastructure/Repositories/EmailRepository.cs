using Authentication.Application.IRepositories;
using Authentication.Domain.Entities;
using Authentication.Infrastructure.Data;
using Authentication.Infrastructure.Ulties;
using Microsoft.EntityFrameworkCore;
namespace Authentication.Infrastructure.Repositories
{
    public class EmailRepository : IEmailRepository
    {
        private AuthenticationDbContext _context;

        public EmailRepository(AuthenticationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<string?> GetForgotPasswordTemplate(string email, string to, string otp)
        {
            var user = await GetUserByEmailAsync(email);
            if (user == null) { throw new Exception("User not found"); }

            return ForgotPasswordTemplate.Build(
                userName: user.Username,
                to: to,
                otp: otp
            );
        }

        public async Task<string?> GetPasswordChangedTemplate(string email, string to)
        {
            var user = await GetUserByEmailAsync(email);
            if (user == null) throw new Exception("User not found");

            return PasswordChangedTemplate.Build(
                user.Username,
                to
            );
        }

        public async Task<string?> GetEmailVerificationTemplate(string email, string to, string otp, string? password = null)
        {
            var user = await GetUserByEmailAsync(email);
            if (user == null) { throw new Exception("User not found"); }

            return EmailVerificationTemplate.Build(
                userName: user.Username,
                to: to,
                otp: otp,
                password: password
                );
        }
    }
}
