using System;

namespace System.Application.IRepositories
{
    public interface IUnitOfWork
    {
        IMaintenanceRepository MaintenanceRepository { get; }
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}

