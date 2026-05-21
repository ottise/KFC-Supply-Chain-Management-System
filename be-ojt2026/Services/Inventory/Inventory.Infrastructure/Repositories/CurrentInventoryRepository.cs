using Inventory.Application.IRepositories;
using Inventory.Application.DTOs;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class CurrentInventoryRepository : ICurrentInventoryRepository
    {
        private readonly InventoryDbContext _context;

        public CurrentInventoryRepository(InventoryDbContext context)
        {
            _context = context;
        }

        private async Task SyncDraftAdjustmentItemsSystemQtyAsync(CurrentInventory inventory)
        {
            if (inventory == null)
                return;

            if (!inventory.ProductId.HasValue || inventory.ProductId.Value <= 0)
                return;

            if (!inventory.LocationId.HasValue || inventory.LocationId.Value <= 0)
                return;

            // LotId có thể null (không bắt buộc luôn tồn tại theo model).
            var productId = inventory.ProductId.Value;
            var locationId = inventory.LocationId.Value;
            var lotId = inventory.LotId;
            var systemQty = inventory.Quantity ?? 0m;

            // Chỉ sync cho phiếu kiểm kê đang ở trạng thái Draft
            var draftItems = await _context.InventoryAdjustmentItems
                .Where(i =>
                    i.ProductId == productId
                    && i.LocationId == locationId
                    && i.LotId == lotId
                    && i.AdjustmentId != null
                    && i.Adjustment!.Status == "Draft")
                .ToListAsync();

            if (draftItems.Count == 0)
                return;

            foreach (var item in draftItems)
            {
                item.SystemQty = systemQty;
                // Nếu staff đã nhập CountedQty thì cập nhật lại chênh lệch theo system mới.
                // Nếu chưa nhập thì giữ DifferenceQty = null để tránh hiển thị sai.
                item.DifferenceQty = item.CountedQty.HasValue
                    ? item.CountedQty.Value - systemQty
                    : null;
            }

            // Đồng bộ luôn "Kế hoạch" trên StockTransaction của nghiệp vụ kiểm kê (ADJ-...)
            // để màn "lịch sử" hiển thị System (Planned) mới thay vì snapshot lúc tạo draft.
            var draftAdjustmentIds = draftItems
                .Select(x => x.AdjustmentId)
                .Where(x => x.HasValue)
                .Select(x => x!.Value)
                .Distinct()
                .ToList();

            if (draftAdjustmentIds.Count == 0)
                return;

            var draftDocIds = await _context.StockDocuments
                .Where(d =>
                    d.ReferenceType == StockDocumentReferenceType.InventoryAdjustment.ToString()
                    && d.ReferenceId.HasValue
                    && draftAdjustmentIds.Contains(d.ReferenceId.Value))
                .Select(d => d.Id)
                .ToListAsync();

            if (draftDocIds.Count == 0)
                return;

            var draftAdjTransactions = await _context.StockTransactions
                .Where(t =>
                    t.DocumentId.HasValue
                    && draftDocIds.Contains(t.DocumentId.Value)
                    && t.TransactionType == StockTransactionType.Adjustment.ToString()
                    && t.Status == StockTransactionStatus.Draft.ToString()
                    && t.ProductId == productId
                    && t.FromLocationId == locationId
                    && t.LotId == lotId)
                .ToListAsync();

            foreach (var t in draftAdjTransactions)
            {
                t.PlannedQty = systemQty;
            }
        }

        public async Task<IEnumerable<CurrentInventory>> GetAllAsync()
        {
            return await _context.CurrentInventories.ToListAsync();
        }

        public async Task<CurrentInventory?> GetByProductLocationLotAsync(int productId, int locationId, int? lotId)
        {
            return await _context.CurrentInventories.FirstOrDefaultAsync(x =>
                x.ProductId == productId
                && x.LocationId == locationId
                && x.LotId == lotId);
        }

        public async Task<List<CurrentInventory>> GetAvailableByProductLocationAsync(int productId, int locationId)
        {
            return await _context.CurrentInventories
                .Include(x => x.Lot)
                .Where(x => x.ProductId == productId
                    && x.LocationId == locationId
                    && x.LotId.HasValue
                    && ((x.Quantity ?? 0) - (x.ReservedQuantity ?? 0)) > 0)
                .ToListAsync();
        }

        public async Task<List<CurrentInventory>> GetAllByProductLocationAsync(int productId, int locationId)
        {
            return await _context.CurrentInventories
                .Include(x => x.Lot)
                .Where(x => x.ProductId == productId
                    && x.LocationId == locationId
                    && x.LotId.HasValue)
                .ToListAsync();
        }

        public async Task<List<CurrentInventory>> GetReservedByProductLocationAsync(int productId, int locationId)
        {
            return await _context.CurrentInventories
                .Include(x => x.Lot)
                .Where(x => x.ProductId == productId
                    && x.LocationId == locationId
                    && x.LotId.HasValue
                    && (x.ReservedQuantity ?? 0) > 0)
                .ToListAsync();
        }

        public async Task AddAsync(CurrentInventory currentInventory)
        {
            await _context.CurrentInventories.AddAsync(currentInventory);
            await SyncDraftAdjustmentItemsSystemQtyAsync(currentInventory);
        }

        public async Task UpdateAsync(CurrentInventory currentInventory)
        {
            _context.CurrentInventories.Update(currentInventory);
            await SyncDraftAdjustmentItemsSystemQtyAsync(currentInventory);
        }

        public async Task<CurrentInventory?> GetCurrentInventoryById(int id)
        {
            return await _context.CurrentInventories.FindAsync(id);
        }

        public async Task UpdateQuantityCurrentInventory(int id, decimal quantity)
        {
            var currentInventory = await GetCurrentInventoryById(id);
            if (currentInventory != null)
            {
                currentInventory.Quantity = quantity;
                _context.CurrentInventories.Update(currentInventory);
                await SyncDraftAdjustmentItemsSystemQtyAsync(currentInventory);
            }
        }

        public async Task<IEnumerable<CurrentInventory>> GetByLocationAsync(int locationId)
        {
            return await _context.CurrentInventories
                                 .Include(ci => ci.Product)
                                 .Where(ci => ci.LocationId == locationId)
                                 .ToListAsync();
        }

        public async Task<CurrentInventory?> GetCurrentInventoryByLotIdAndProductIdAndLocationId(int productId, int lotId, int location)
        {
            return await _context.CurrentInventories
                .FirstOrDefaultAsync(ci => ci.ProductId == productId && ci.LotId == lotId && ci.LocationId == location);
        }

        public async Task<CurrentInventory> CreateCurrentInventory(CurrentInventory currentInventory)
        {
            await _context.CurrentInventories.AddAsync(currentInventory);
            return currentInventory;
        }

        public async Task UpdateCurrentInventory(CurrentInventory inventory)
        {
            _context.CurrentInventories.Update(inventory);
            await SyncDraftAdjustmentItemsSystemQtyAsync(inventory);
        }
        public async Task<IEnumerable<CurrentInventory>> GetByIdsAsync(List<int> ids)
        {
            return await _context.CurrentInventories
                .Include(ci => ci.Product)
                .Where(ci => ids.Contains(ci.Id))
                .ToListAsync();
        }
        public async Task<List<CurrentInventory>> GetCurrentInventoriesByLocationIdsAsync(List<int> locationIds)
        {
            if (locationIds == null || !locationIds.Any())
                return new List<CurrentInventory>();

            var inventories = await _context.CurrentInventories
                .Include(ci => ci.Product)
                .Where(inv => inv.LocationId.HasValue && locationIds.Contains(inv.LocationId.Value))
                .ToListAsync();

            return inventories;
        }

        public async Task<List<CurrentInventory>> GetCurrentInventoriesByLotIdAsync(int lotId)
        {
            return await _context.CurrentInventories
                .Include(ci => ci.Location)
                .Where(ci => ci.LotId == lotId)
                .ToListAsync();
        }

        public async Task<List<CurrentInventory>> GetCurrentInventoriesByLotIdsAsync(List<int> lotIds)
        {
            if (lotIds == null || !lotIds.Any())
                return new List<CurrentInventory>();

            return await _context.CurrentInventories
                .Include(ci => ci.Location)
                .Where(ci => ci.LotId.HasValue && lotIds.Contains(ci.LotId.Value))
                .ToListAsync();
        }

        public async Task<List<string>> GetDistinctProductTypesAsync()
        {
            var types = await _context.Products
                 .Where(p => p.IsActive == true && !string.IsNullOrWhiteSpace(p.ProductType))
                 .Select(p => p.ProductType!)
                 .Distinct()
                 .ToListAsync();
            return types.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        }
    }
}
