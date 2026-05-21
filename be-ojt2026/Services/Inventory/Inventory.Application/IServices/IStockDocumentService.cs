using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface IStockDocumentService
    {
        // Delivery/Transfer methods (HEAD)
        Task<PagedResultDto<StockDocumentListItemDto>> GetStockDocumentsAsync(int managerId, string? status, string? documentType, string? search, int? warehouseId, int? locationId, int page = 1, int pageSize = 5, int? productId = null, int? lotId = null, DateTime? fromDate = null, DateTime? toDate = null, int? createdByUserId = null, string? dateType = null);
        Task<StockDocumentDetailDto> GetStockDocumentByIdAsync(int managerId, int id);
        Task<StockDocumentStatusCountDto> GetStatusCountAsync(int managerId, string? documentType, string? search = null, int? warehouseId = null, int? locationId = null);

        // Adjustment/Purchase methods (origin/dev)
        Task<StockDocument> CreateStockDocument(CreateStockDocumentDto dto);
        Task CompleteStockDocument(int id, string origin);
        Task<StockDocument> GetStockDocumentById(int id);
        Task<StockDocument?> GetStockDocumentByPoNo(string poNo);
        Task<StockDocument> CreateStockDocumentPurchase(StockDocument stockDocument);
        Task<List<StockDocument>> GetAllAsync();
        Task UpdateStockDocument(StockDocument doc);
        Task DeleteAsync(int id);
        Task<List<StockDocument>> GetStockDocumentsByTypeAsync(string type, int? managerId, int userId);

        Task<List<StockDocument>> GetPurchaseOrderDocumentsByStatusAsync(string status, int? managerId, int userId);
        Task<StockDocument> GetStockDocumentByReferenceId(int adjustmentId);
    }
}
