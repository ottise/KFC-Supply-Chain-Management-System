using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class StockTransactionRepository : IStockTransactionRepository
    {
        private readonly InventoryDbContext _context;

        public StockTransactionRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockTransaction>> GetAllAsync()
        {
            return await _context.StockTransactions.ToListAsync();
        }

        public async Task<IEnumerable<StockTransaction>> GetByDocumentIdAsync(int documentId)
        {
            return await _context.StockTransactions
                .Include(x => x.Product)
                .Include(x => x.Uom)
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Include(x => x.Lot)
                .Where(x => x.DocumentId == documentId)
                .OrderBy(x => x.Id)
                .ToListAsync();
        }

        public async Task<StockTransaction?> GetByIdAsync(int id)
        {
            return await _context.StockTransactions.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(StockTransaction transaction)
        {
            await _context.StockTransactions.AddAsync(transaction);
        }

        public Task UpdateAsync(StockTransaction transaction)
        {
            _context.StockTransactions.Update(transaction);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(StockTransaction transaction)
        {
            _context.StockTransactions.Remove(transaction);
            return Task.CompletedTask;
        }

        public async Task<StockTransaction> CreateStockTransaction(StockTransaction stock)
        {
            var stockTransaction = new StockTransaction
            {
                DocumentId = stock.DocumentId,
                ProductId = stock.ProductId,
                UomId = stock.UomId,
                FromLocationId = stock.FromLocationId,
                ToLocationId = stock.ToLocationId,
                PlannedQty = stock.PlannedQty,
                ReservedQty = stock.ReservedQty,
                LotId = stock.LotId,
                TransactionType = StockTransactionType.Adjustment.ToString(),
                Status = StockTransactionStatus.Draft.ToString(),
                CreatedAt = DateTime.UtcNow,
                PlannedDate = stock.PlannedDate  
            };

            await _context.StockTransactions.AddAsync(stockTransaction);
            await _context.SaveChangesAsync();
            return stockTransaction;
        }

        public async Task CompleteStockTransaction(int id, decimal count)
        {
            var stockTransaction = await _context.StockTransactions.FindAsync(id);
            if (stockTransaction != null)
            {
                stockTransaction.Status = StockTransactionStatus.Completed.ToString();
                stockTransaction.CompletedAt = DateTime.UtcNow;
                stockTransaction.ActualQty = count;

                _context.StockTransactions.Update(stockTransaction);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<StockTransaction?> GetTransactionById(int id)
        {
            return await _context.StockTransactions.FindAsync(id);
        }

        public async Task<StockTransaction> CreateStockTransactionPurchase(StockTransaction transaction)
        {
            await _context.StockTransactions.AddAsync(transaction);
            return transaction;
        }
        public async Task<List<StockTransaction>> GetByDocumentId(int documentId)
        {
            return await _context.StockTransactions
                .Where(x => x.DocumentId == documentId)
                .ToListAsync();
        }

        public async Task UpdateStockTransaction(StockTransaction transaction)
        {
            _context.StockTransactions.Update(transaction);
            await Task.CompletedTask;
        }
        public async Task<IEnumerable<StockTransaction>> GetByInventoryIdsAsync(List<int> inventoryIds)
        {
            if (inventoryIds == null || !inventoryIds.Any())
                throw new ArgumentException("Danh sách inventory không được rỗng");

            var inventories = await _context.CurrentInventories
                .Where(ci => inventoryIds.Contains(ci.Id))
                .ToListAsync();

            if (inventories == null || !inventories.Any())
                throw new KeyNotFoundException("Không tìm thấy dữ liệu inventory");

            var transactions = await _context.StockTransactions
                .Where(tx => inventories.Any(inv =>
                    inv.ProductId == tx.ProductId &&
                    inv.LocationId == tx.FromLocationId &&
                    inv.LotId == tx.LotId))
                .ToListAsync();

            return transactions;
        }
        public async Task<StockTransaction?> GetByProductLocationLotAsync(int productId, int locationId, int? lotId)
        {
            if (productId <= 0 || locationId <= 0)
                throw new ArgumentException("ProductId và LocationId phải hợp lệ");

            var query = _context.StockTransactions
                .Where(tx => tx.ProductId == productId &&
                             tx.FromLocationId == locationId);

            if (lotId.HasValue)
            {
                query = query.Where(tx => tx.LotId == lotId.Value);
            }

            return await query.FirstOrDefaultAsync();
        }
        public async Task<List<StockTransaction>> GetByProductLocationLotAll(int productId, int locationId, int? lotId)
        {
            return await _context.StockTransactions
                .Where(s => s.ProductId == productId
                         && s.FromLocationId == locationId
                         && s.LotId == lotId)
                .ToListAsync();
        }

    }
}
