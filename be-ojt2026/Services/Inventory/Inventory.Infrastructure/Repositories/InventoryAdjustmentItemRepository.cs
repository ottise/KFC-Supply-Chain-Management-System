using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Inventory.Infrastructure.Repositories
{
    public class InventoryAdjustmentItemRepository : IInventoryAdjustmentItemRepository
    {
        private readonly InventoryDbContext _context;

        public InventoryAdjustmentItemRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<InventoryAdjustmentItem>> GetAllAsync()
        {
            return await _context.InventoryAdjustmentItems.ToListAsync();
        }
       

        
        public async Task<InventoryAdjustmentItem?> GetInventoryAdjustmentItemByIdAsync(int id)
        {
            return await _context.InventoryAdjustmentItems.FindAsync(id);
        }


        public async Task<List<InventoryAdjustmentItem>> GetInventoryAdjustmentItemsByAdjustmentIdAsync(int adjId)
        {
            return await _context.InventoryAdjustmentItems
                                  .Where(x => x.AdjustmentId == adjId)
                                  .ToListAsync();
        }
        public async Task CreateInventoryAdjustmentItem(InventoryAdjustmentItem item)
        {
            await _context.InventoryAdjustmentItems.AddAsync(item);
        }

        public async Task UpdateCountAdjustmentItem(int adjItemId, decimal count, decimal? systemQty = null)
        {
            var existingItem = await _context.InventoryAdjustmentItems.FindAsync(adjItemId);
            if (existingItem == null)
                throw new KeyNotFoundException($"AdjustmentItem {adjItemId} not found");

            if (systemQty.HasValue)
                existingItem.SystemQty = systemQty.Value;

            existingItem.CountedQty = count;
            existingItem.DifferenceQty = count - (existingItem.SystemQty ?? 0);

            _context.InventoryAdjustmentItems.Update(existingItem);
        }


        public async Task<InventoryAdjustmentItem?> GetByAdjustmentAndProduct(int adjustmentId, int productId)
        {
            return await _context.InventoryAdjustmentItems
                .FirstOrDefaultAsync(i => i.AdjustmentId == adjustmentId && i.ProductId == productId);
        }


    }
}
