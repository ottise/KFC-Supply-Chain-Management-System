using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class TransferOrderRepository : ITransferOrderRepository
    {
        private readonly InventoryDbContext _context;

        public TransferOrderRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TransferOrder>> GetAllAsync()
        {
            return await _context.TransferOrders
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .ToListAsync();
        }

        public async Task<TransferOrder?> GetByIdAsync(int id)
        {
            return await _context.TransferOrders.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<TransferOrder?> GetByIdWithItemsAsync(int id)
        {
            return await _context.TransferOrders
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Include(x => x.TransferOrderItems)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(TransferOrder transferOrder)
        {
            await _context.TransferOrders.AddAsync(transferOrder);
        }

        public Task UpdateAsync(TransferOrder transferOrder)
        {
            _context.TransferOrders.Update(transferOrder);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(TransferOrder transferOrder)
        {
            _context.TransferOrders.Remove(transferOrder);
            return Task.CompletedTask;
        }

        public async Task<int> CountByStatusAsync(string status)
        {
            return await _context.TransferOrders.CountAsync(x => x.Status == status);
        }
    }
}
