using System.Collections.Generic;
using System.Threading.Tasks;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface IPurchaseOrderRepository
{
    Task<IEnumerable<PurchaseOrder>> GetAllAsync();
    Task<PurchaseOrder?> GetByIdAsync(int id);
    Task<List<PurchaseOrder>> GetBySupplierIdAsync(int supplierId);
    Task<List<PurchaseOrder>> GetByStatusAsync(string status);
    Task<List<PurchaseOrder>> GetByCreatedAtAsync(DateTime createdAt);
    Task<List<PurchaseOrder>> GetByConfirmedAtAsync(DateTime confirmedAt);
    Task<List<PurchaseOrder>> GetByCompletedAtAsync(DateTime completedAt);

    Task UpdateSupplierAsync(int id, int supplierId);
    Task UpdateStatusAsync(int id, string status);

    Task AddAsync(CreatePurchaseOrderDto order);


    Task<PurchaseOrder> CreatePurchaseOrder(PurchaseOrder order);
    Task UpdatePurchaseOrder(PurchaseOrder po);
    Task<(List<PurchaseOrderResponseDto> Items, int TotalCount)> SearchAsync(PurchaseOrderSearchDto searchDto);
    Task<PurchaseOrderResponseDto?> GetDetailByIdAsync(int id);
    Task DeleteAsync(PurchaseOrder order);
}

