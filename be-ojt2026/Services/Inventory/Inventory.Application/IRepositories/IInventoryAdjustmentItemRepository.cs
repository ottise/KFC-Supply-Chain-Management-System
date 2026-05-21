using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface IInventoryAdjustmentItemRepository
    {
        Task<IEnumerable<InventoryAdjustmentItem>> GetAllAsync();
        Task CreateInventoryAdjustmentItem(InventoryAdjustmentItem item);
        Task<InventoryAdjustmentItem?> GetInventoryAdjustmentItemByIdAsync(int id);
        Task<List<InventoryAdjustmentItem>> GetInventoryAdjustmentItemsByAdjustmentIdAsync(int adjId);
        Task UpdateCountAdjustmentItem(int adjItemId, decimal count, decimal? systemQty = null);
        Task<InventoryAdjustmentItem?> GetByAdjustmentAndProduct(int adjustmentId, int productId);
    }
}
