using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class SaleOrderRepository : ISaleOrderRepository
    {
        private readonly InventoryDbContext _context;

        public SaleOrderRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SaleOrder>> GetAllAsync()
        {
            return await _context.SaleOrders
                .Include(x => x.Customer)
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .ToListAsync();
        }

        public async Task<SaleOrder?> GetByIdAsync(int id)
        {
            return await _context.SaleOrders.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<SaleOrder?> GetByIdWithItemsAsync(int id)
        {
            return await _context.SaleOrders
                .Include(x => x.Customer)
                .Include(x => x.SaleOrderItems)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(SaleOrder saleOrder)
        {
            await _context.SaleOrders.AddAsync(saleOrder);
        }

        public Task UpdateAsync(SaleOrder saleOrder)
        {
            _context.SaleOrders.Update(saleOrder);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(SaleOrder saleOrder)
        {
            _context.SaleOrders.Remove(saleOrder);
            return Task.CompletedTask;
        }

        public async Task<int> CountByStatusAsync(string status)
        {
            return await _context.SaleOrders.CountAsync(x => x.Status == status);
        }
    }
}
