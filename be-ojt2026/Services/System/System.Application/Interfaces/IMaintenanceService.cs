using System.Collections.Generic;
using System.Threading.Tasks;
using System.Domain.Entities;

namespace System.Application.Interfaces
{
    public interface IMaintenanceService
    {
        Task<SystemMaintenance?> GetActiveMaintenanceAsync();
        Task<IEnumerable<SystemMaintenance>> GetAllTicketsAsync();
        Task<SystemMaintenance?> GetTicketByIdAsync(string id);
        Task<SystemMaintenance> CreateTicketAsync(SystemMaintenance maintenance);
        Task<bool> UpdateTicketAsync(string id, SystemMaintenance maintenance);
        Task<bool> DeactivateTicketAsync(string id);
    }
}
