using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IRepositories
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository UserRepository { get; }
        IRoleRepository RoleRepository { get; }
        IEmailRepository EmailRepository { get; }
        IEmailVerificationRepository EmailVerificationRepository { get; }

        Task<int> SaveChangesAsync();

    }
}
