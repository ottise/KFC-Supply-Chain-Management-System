using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface IInventoryAdjustmentItemService
    {
        Task CreateAdjustmentItem(InventoryAdjustmentItem item);
        Task<InventoryAdjustmentItem?> GetAdjustmentItemById(int id);
        Task<IEnumerable<InventoryAdjustmentItem>> GetItemsByAdjustmentId(int adjId);
        Task UpdateCount(int adjItemId, decimal countedQty, decimal? systemQty = null);
        Task<InventoryAdjustmentItem> GetByAdjustmentAndProduct(int adjustmentId, int productId);
    }
}
