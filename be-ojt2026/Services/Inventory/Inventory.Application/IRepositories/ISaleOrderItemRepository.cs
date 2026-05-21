using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface ISaleOrderItemRepository
{
    Task<IEnumerable<SaleOrderItem>> GetAllAsync();
    Task<IEnumerable<SaleOrderItem>> GetBySaleOrderIdAsync(int saleOrderId);
    Task<SaleOrderItem?> GetByIdAsync(int id);
    Task AddAsync(SaleOrderItem item);
    Task UpdateAsync(SaleOrderItem item);
    Task DeleteAsync(SaleOrderItem item);
}
