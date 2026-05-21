using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class SaleOrderItemRepository : ISaleOrderItemRepository
    {
        private readonly InventoryDbContext _context;

        public SaleOrderItemRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SaleOrderItem>> GetAllAsync()
        {
            return await _context.SaleOrderItems
                .Include(x => x.Product)
                .ToListAsync();
        }

        public async Task<IEnumerable<SaleOrderItem>> GetBySaleOrderIdAsync(int saleOrderId)
        {
            return await _context.SaleOrderItems
                .Where(x => x.SaleOrderId == saleOrderId)
                .ToListAsync();
        }

        public async Task<SaleOrderItem?> GetByIdAsync(int id)
        {
            return await _context.SaleOrderItems.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(SaleOrderItem item)
        {
            await _context.SaleOrderItems.AddAsync(item);
        }

        public Task UpdateAsync(SaleOrderItem item)
        {
            _context.SaleOrderItems.Update(item);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(SaleOrderItem item)
        {
            _context.SaleOrderItems.Remove(item);
            return Task.CompletedTask;
        }
    }
}
