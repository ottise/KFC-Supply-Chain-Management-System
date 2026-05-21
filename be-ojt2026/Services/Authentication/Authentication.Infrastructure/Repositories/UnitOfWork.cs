using Authentication.Application.IRepositories;
using Authentication.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AuthenticationDbContext _context;

        public UnitOfWork(AuthenticationDbContext context)
        {
            _context = context;
        }

        public IUserRepository UserRepository => new UserRepository(_context);

        public IRoleRepository RoleRepository => new RoleRepository(_context);

        public IEmailRepository EmailRepository => new EmailRepository(_context);
        public IEmailVerificationRepository EmailVerificationRepository => new EmailVerificationRepository(_context);

        public IOtpRepository OtpRepository => new OtpRepository(_context);

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
