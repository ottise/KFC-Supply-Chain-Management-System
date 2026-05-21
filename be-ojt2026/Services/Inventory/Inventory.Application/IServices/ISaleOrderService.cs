using Inventory.Application.DTOs;

namespace Inventory.Application.IServices;

public interface ISaleOrderService
{
    // === Query ===
    Task<PagedResultDto<SaleOrderListItemDto>> GetAllAsync(int? managerId, int? userId, string? status, string? orderNo, string? locationName, string? createdBy, int? createdById, DateTime? fromDate, DateTime? toDate, DateTime? fromPlannedDate, DateTime? toPlannedDate, int page, int pageSize);
    Task<SaleOrderDetailDto> GetByIdAsync(int id);
    Task<SaleOrderStatusCountDto> GetStatusCountAsync();

    // === CRUD Header ===
    Task<SaleOrderDetailDto> CreateAsync(int? managerId, int userId, string? userName, CreateSaleOrderDto dto);
    Task<SaleOrderDetailDto> UpdateAsync(int? managerId, int userId, int id, UpdateSaleOrderDto dto);
    Task DeleteAsync(int id);

    // === CRUD Items ===
    Task<SaleOrderDetailDto> AddItemAsync(int orderId, SaleOrderItemUpsertDto dto);
    Task<SaleOrderDetailDto> UpdateItemAsync(int orderId, int itemId, SaleOrderItemUpsertDto dto);
    Task<SaleOrderDetailDto> DeleteItemAsync(int orderId, int itemId);

    // === Status workflow ===
    Task<SaleOrderDetailDto> CheckAvailabilityAsync(int id);
    Task<SaleOrderDetailDto> MarkDoneAsync(int id);
    Task<SaleOrderDetailDto> CancelAsync(int id);
}
