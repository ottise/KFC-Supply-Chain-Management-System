using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface ISaleOrderRepository
{
    Task<IEnumerable<SaleOrder>> GetAllAsync();
    Task<SaleOrder?> GetByIdAsync(int id);
    Task<SaleOrder?> GetByIdWithItemsAsync(int id);
    Task AddAsync(SaleOrder saleOrder);
    Task UpdateAsync(SaleOrder saleOrder);
    Task DeleteAsync(SaleOrder saleOrder);
    Task<int> CountByStatusAsync(string status);
}
