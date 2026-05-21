using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class InventoryAdjustmentItemService : IInventoryAdjustmentItemService
    {
        private readonly IUnitOfWork _unitOfWork;

        public InventoryAdjustmentItemService(IUnitOfWork uow)
        {
            _unitOfWork = uow;
        }

        public async Task CreateAdjustmentItem(InventoryAdjustmentItem item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            if (item.ProductId <= 0)
                throw new ArgumentException("ProductId must be greater than 0");

            await _unitOfWork.InventoryAdjustmentItem.CreateInventoryAdjustmentItem(item);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<InventoryAdjustmentItem?> GetAdjustmentItemById(int id)
        {
            if (id < 0)
                throw new ArgumentException("Invalid adjustment item id");

            return await _unitOfWork.InventoryAdjustmentItem.GetInventoryAdjustmentItemByIdAsync(id);
            
        }

        public async Task<IEnumerable<InventoryAdjustmentItem>> GetItemsByAdjustmentId(int adjId)
        {
            if (adjId <= 0)
                throw new ArgumentException("Invalid adjustment id");

            return await _unitOfWork.InventoryAdjustmentItem.GetInventoryAdjustmentItemsByAdjustmentIdAsync(adjId);
        }

        public async Task UpdateCount(int adjItemId, decimal countedQty, decimal? systemQty = null)
        {
            if (adjItemId < 0)
                throw new ArgumentException("Invalid adjustment item id");

            if (countedQty < 0)
                throw new ArgumentException("Counted quantity cannot be negative");

            await _unitOfWork.InventoryAdjustmentItem.UpdateCountAdjustmentItem(adjItemId, countedQty, systemQty);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<InventoryAdjustmentItem> GetByAdjustmentAndProduct(int adjustmentId, int productId)
        {
            var item = await _unitOfWork.InventoryAdjustmentItem.GetByAdjustmentAndProduct(adjustmentId, productId);
            if (item == null)
                throw new KeyNotFoundException($"AdjustmentItem not found for Adjustment {adjustmentId} and Product {productId}");

            return item;
        }

    }
}
