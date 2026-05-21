using System.Collections.Generic;
using System.Threading.Tasks;
using Inventory.Application.DTOs;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface IPurchaseOrderService
    {
        Task<IEnumerable<PurchaseOrder>> GetAllAsync();
        Task<PurchaseOrder> GetByIdAsync(int id);
        Task<List<PurchaseOrder>> GetBySupplierIdAsync(int supplierId);
        Task<List<PurchaseOrder>> GetByStatusAsync(string status);
        Task<List<PurchaseOrder>> GetByCreatedAtAsync(DateTime createdAt);
        Task<List<PurchaseOrder>> GetByConfirmedAtAsync(DateTime confirmedAt);
        Task<List<PurchaseOrder>> GetByCompletedAtAsync(DateTime completedAt);

        Task AddAsync(CreatePurchaseOrderDto dto);

        Task UpdateSupplierAsync(int id, int supplierId);
        Task UpdateStatusAsync(int id, string status);

        Task<PurchaseOrder> CreatePurchaseOrder(PurchaseOrder order);
        Task UpdatePurchaseOrder(PurchaseOrder po);
        Task<PagedResultDto<PurchaseOrderResponseDto>> SearchAsync(PurchaseOrderSearchDto searchDto);
        Task<PurchaseOrderResponseDto?> GetDetailByIdAsync(int id);
        Task DeleteAsync(int id);
    }
}

