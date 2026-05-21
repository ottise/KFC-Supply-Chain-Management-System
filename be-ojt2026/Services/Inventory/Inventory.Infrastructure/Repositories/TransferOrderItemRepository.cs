using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class TransferOrderItemRepository : ITransferOrderItemRepository
    {
        private readonly InventoryDbContext _context;

        public TransferOrderItemRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TransferOrderItem>> GetAllAsync()
        {
            return await _context.TransferOrderItems
                .Include(x => x.Product)
                .ToListAsync();
        }

        public async Task<IEnumerable<TransferOrderItem>> GetByTransferOrderIdAsync(int transferOrderId)
        {
            return await _context.TransferOrderItems
                .Where(x => x.TransferOrderId == transferOrderId)
                .ToListAsync();
        }

        public async Task<TransferOrderItem?> GetByIdAsync(int id)
        {
            return await _context.TransferOrderItems.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(TransferOrderItem item)
        {
            await _context.TransferOrderItems.AddAsync(item);
        }

        public Task UpdateAsync(TransferOrderItem item)
        {
            _context.TransferOrderItems.Update(item);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(TransferOrderItem item)
        {
            _context.TransferOrderItems.Remove(item);
            return Task.CompletedTask;
        }
    }
}
