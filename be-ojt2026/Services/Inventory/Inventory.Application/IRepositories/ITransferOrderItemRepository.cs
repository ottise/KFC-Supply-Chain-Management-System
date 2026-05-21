using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface ITransferOrderItemRepository
{
    Task<IEnumerable<TransferOrderItem>> GetAllAsync();
    Task<IEnumerable<TransferOrderItem>> GetByTransferOrderIdAsync(int transferOrderId);
    Task<TransferOrderItem?> GetByIdAsync(int id);
    Task AddAsync(TransferOrderItem item);
    Task UpdateAsync(TransferOrderItem item);
    Task DeleteAsync(TransferOrderItem item);
}
