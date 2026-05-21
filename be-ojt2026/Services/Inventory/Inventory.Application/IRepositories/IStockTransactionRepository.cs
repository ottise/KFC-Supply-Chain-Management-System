using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface IStockTransactionRepository
    {
        Task<IEnumerable<StockTransaction>> GetAllAsync();
    Task<IEnumerable<StockTransaction>> GetByDocumentIdAsync(int documentId);
    Task<StockTransaction?> GetByIdAsync(int id);
    Task AddAsync(StockTransaction transaction);
    Task UpdateAsync(StockTransaction transaction);
    Task DeleteAsync(StockTransaction transaction);
        Task<StockTransaction> CreateStockTransaction(StockTransaction stock);
        Task CompleteStockTransaction(int id, decimal count);
        Task<StockTransaction?> GetTransactionById(int id);
        Task<StockTransaction> CreateStockTransactionPurchase(StockTransaction transaction);
        Task<List<StockTransaction>> GetByDocumentId(int documentId);
       Task UpdateStockTransaction(StockTransaction transaction);

        Task<IEnumerable<StockTransaction>> GetByInventoryIdsAsync(List<int> inventoryIds);
        Task<StockTransaction?> GetByProductLocationLotAsync(int productId, int locationId, int? lotId);
        Task<List<StockTransaction>> GetByProductLocationLotAll(int productId, int locationId, int? lotId);
    }
}
