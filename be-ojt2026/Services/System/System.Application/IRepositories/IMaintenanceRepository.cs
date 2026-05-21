using System.Collections.Generic;
using System.Threading.Tasks;
using System.Domain.Entities;
using System.Domain.Enums;

namespace System.Application.IRepositories
{
    public interface IMaintenanceRepository
    {
        Task<IEnumerable<SystemMaintenance>> GetAllAsync();
        Task<SystemMaintenance?> GetByIdAsync(string id);
        Task<SystemMaintenance?> GetActiveMaintenanceAsync();
        Task<IEnumerable<SystemMaintenance>> GetByStatusAsync(MaintenanceStatus status);
        Task AddAsync(SystemMaintenance maintenance);
        Task UpdateAsync(SystemMaintenance maintenance);
        Task<string> GetLastTicketIdAsync();
        Task SaveChangesAsync();
    }
}
