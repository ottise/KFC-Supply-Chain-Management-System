using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ScrapOrder;

namespace Inventory.Application.IServices;

public interface IScrapOrderService
{
    Task<PagedResultDto<ScrapOrderListItemDto>> GetAllAsync(int? managerId, int? userId, string? status, int page, int pageSize, CancellationToken cancellationToken = default, string? scrapNo = null, string? locationName = null, string? createdBy = null);
    Task<ScrapOrderDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ScrapOrderStatusCountDto> GetStatusCountAsync(int? managerId, int? userId, CancellationToken cancellationToken = default);
    Task<ScrapOrderDetailDto> CreateAsync(int managerId, string createdByName, CreateScrapOrderDto dto, CancellationToken cancellationToken = default);
    Task<ScrapOrderDetailDto> CheckAvailabilityAsync(int managerId, int id, CancellationToken cancellationToken = default);
    Task<ScrapOrderDetailDto> MarkDoneAsync(int managerId, int id, CancellationToken cancellationToken = default);
    Task<ScrapOrderDetailDto> CancelAsync(int managerId, int id, CancellationToken cancellationToken = default);
    Task<ScrapOrderDetailDto> UpdateAsync(int managerId, int id, CreateScrapOrderDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(int managerId, int id, CancellationToken cancellationToken = default);
}
