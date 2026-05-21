using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface ITransferOrderRepository
{
    Task<IEnumerable<TransferOrder>> GetAllAsync();
    Task<TransferOrder?> GetByIdAsync(int id);
    Task<TransferOrder?> GetByIdWithItemsAsync(int id);
    Task AddAsync(TransferOrder transferOrder);
    Task UpdateAsync(TransferOrder transferOrder);
    Task DeleteAsync(TransferOrder transferOrder);
    Task<int> CountByStatusAsync(string status);
}
