using System.Collections.Generic;
using System.Threading.Tasks;
using System.Application.DTOs.Maintenance;
using System.Domain.Enums;

namespace System.Application.IServices
{
    public interface IMaintenanceService
    {
        Task<MaintenanceResponse?> GetActiveMaintenanceAsync();

        Task<IEnumerable<MaintenanceResponse>> GetUpcomingMaintenanceAsync(int limit = 5);
        
        Task<(IEnumerable<MaintenanceResponse> Items, int TotalCount)> GetPagedMaintenanceAsync(
            int page, int pageSize, string? keyword, MaintenanceStatus? status = null);

        Task<MaintenanceResponse?> GetByIdAsync(string id);
        
        Task<MaintenanceResponse> CreateTicketAsync(CreateMaintenanceRequest request, string createdBy);
        
        Task<bool> UpdateTicketAsync(string id, UpdateMaintenanceRequest request);
        
        Task<bool> DeleteTicketAsync(string id);

        Task<MaintenanceResponse> StopMaintenanceAsync();
    }
}


