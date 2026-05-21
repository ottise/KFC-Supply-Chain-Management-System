using Inventory.Application.DTOs;

namespace Inventory.Application.IServices;

public interface ITransferOrderService
{
    // === Query ===
    Task<PagedResultDto<TransferOrderListItemDto>> GetAllAsync(string? status, string? transferNo, string? locationName, string? createdBy, int? createdById, int page, int pageSize);
    Task<TransferOrderDetailDto> GetByIdAsync(int id);
    Task<TransferOrderStatusCountDto> GetStatusCountAsync();

    // === CRUD Header ===
    Task<TransferOrderDetailDto> CreateAsync(int? managerId, int userId, string? userName, CreateTransferOrderDto dto);
    Task<TransferOrderDetailDto> UpdateAsync(int? managerId, int userId, int id, UpdateTransferOrderDto dto);
    Task DeleteAsync(int id);

    // === CRUD Items ===
    Task<TransferOrderDetailDto> AddItemAsync(int orderId, TransferOrderItemUpsertDto dto);
    Task<TransferOrderDetailDto> UpdateItemAsync(int orderId, int itemId, TransferOrderItemUpsertDto dto);
    Task<TransferOrderDetailDto> DeleteItemAsync(int orderId, int itemId);

    // === Status workflow ===
    Task<TransferOrderDetailDto> CheckAvailabilityAsync(int id);
    Task<TransferOrderDetailDto> MarkDoneAsync(int id);
    Task<TransferOrderDetailDto> CancelAsync(int id);


    Task<TransferOrderDetailDto> CreateTransferOrderAsync(
     int? managerId, int userId, string? userName, CreateTransferOrderDto dto);
}
