using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface IStockDocumentRepository
    {
        Task<List<StockDocument>> GetAllAsync();
        Task<StockDocument> CreateStockDocument(CreateStockDocumentDto dto);
        Task CompletedStockDocumentStatus(int id, string origin);
        Task<StockDocument?> GetStockDocumentById(int id);

        Task<StockDocument?> GetStockDocumentByPoNo(string poNo);

        Task<StockDocument> CreateStockDocumentPurchase(StockDocument stockDocument);
        Task UpdateStockDocument(StockDocument doc);

        Task<IEnumerable<StockDocument>> GetAllWithLocationsAsync();
        Task<IEnumerable<StockDocument>> GetDeliveriesAsync(string? status = null, string? documentType = null);
        Task<StockDocument?> GetByIdWithDetailsAsync(int id);
        Task<StockDocument?> GetByReferenceWithDetailsAsync(string referenceType, int referenceId);
        Task<StockDocument?> GetByIdAsync(int id);
        Task AddAsync(StockDocument stockDocument);
        Task UpdateAsync(StockDocument stockDocument);
        Task DeleteAsync(StockDocument stockDocument);
        Task<int> CountByStatusAsync(string status, string? documentType = null);
        Task<IEnumerable<StockDocument>> GetByLocationIdsAsync(IEnumerable<int> locationIds, string? status = null, string? documentType = null, string? search = null, int? productId = null, int? lotId = null, DateTime? fromDate = null, DateTime? toDate = null, int? createdByUserId = null, string? dateType = null);
        Task<int> CountByStatusAndLocationIdsAsync(string status, IEnumerable<int> locationIds, string? documentType = null);
        Task<List<StockDocument>> GetStockDocumentByDocumentTypeAsync(string type);
        Task<List<StockDocument>> GetPurchaseOrderDocumentByStatusAsync(string status);
        Task<StockDocument?> GetStockDocumentByReferenceId(int adjustmentId);
        Task<IEnumerable<StockDocument>> GetDashboardTrendDataAsync(DateTime startDate, DateTime endDate);
        Task<IEnumerable<StockDocument>> GetDashboardPendingDataAsync();

    }
}
