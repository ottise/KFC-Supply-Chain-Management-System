using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface IStockTransactionService
    {
        // Delivery/Transfer method (HEAD)
        Task<IEnumerable<StockTransactionDto>> GetByDocumentIdAsync(int managerId, int documentId);

        // Adjustment/Purchase methods (origin/dev)
        Task<IEnumerable<StockTransactionDto>> GetAllAsync();
        Task<StockTransaction> CreateStockTransaction(StockTransaction tran);
        Task CompleteStockTransaction(int id, decimal actualQty);
        Task<StockTransaction> GetTransactionById(int id);
        Task<StockTransaction> CreateStockTransactionPurchase(StockTransaction transaction);
        Task<List<StockTransaction>> GetByDocumentId(int documentId);
        Task UpdateStockTransaction(StockTransaction transaction);
        Task<IEnumerable<StockTransaction>> GetByInventoryIds(List<int> inventoryIds);
        Task<StockTransaction?> GetByProductLocationLot(int productId, int locationId, int? lotId);
        Task<List<StockTransaction>> GetByProductLocationLotAllAsync(int productId, int locationId, int? lotId);
        Task DeleteAsync(int id);
    }
}
