using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class StockDocumentRepository : IStockDocumentRepository
    {
        private readonly InventoryDbContext _context;

        public StockDocumentRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockDocument>> GetAllWithLocationsAsync()
        {
            return await _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .ToListAsync();
        }

        public async Task<IEnumerable<StockDocument>> GetDeliveriesAsync(string? status = null, string? documentType = null)
        {
            var query = _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(documentType))
            {
                query = query.Where(x => x.DocumentType == documentType);
            }
            else
            {
                query = query.Where(x => x.DocumentType == "delivery" || x.DocumentType == "transfer");
            }

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .ToListAsync();
        }

        public async Task<StockDocument?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Include(x => x.StockTransactions)
                    .ThenInclude(t => t.Product)
                .Include(x => x.StockTransactions)
                    .ThenInclude(t => t.Uom)
                .Include(x => x.StockTransactions)
                    .ThenInclude(t => t.FromLocation)
                .Include(x => x.StockTransactions)
                    .ThenInclude(t => t.ToLocation)
                .Include(x => x.StockTransactions)
                    .ThenInclude(t => t.Lot)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<StockDocument?> GetByReferenceWithDetailsAsync(string referenceType, int referenceId)
        {
            return await _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Include(x => x.StockTransactions)
                .FirstOrDefaultAsync(x => x.ReferenceType == referenceType && x.ReferenceId == referenceId);
        }

        public async Task<StockDocument?> GetByIdAsync(int id)
        {
            return await _context.StockDocuments.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(StockDocument stockDocument)
        {
            await _context.StockDocuments.AddAsync(stockDocument);
        }

        public Task UpdateAsync(StockDocument stockDocument)
        {
            _context.StockDocuments.Update(stockDocument);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(StockDocument stockDocument)
        {
            _context.StockDocuments.Remove(stockDocument);
            return Task.CompletedTask;
        }

        public async Task<int> CountByStatusAsync(string status, string? documentType = null)
        {
            var query = _context.StockDocuments.Where(x => x.Status == status);

            if (!string.IsNullOrWhiteSpace(documentType))
            {
                query = query.Where(x => x.DocumentType == documentType);
            }
            else
            {
                query = query.Where(x => x.DocumentType == "delivery" || x.DocumentType == "transfer");
            }

            return await query.CountAsync();
        }

        public async Task<IEnumerable<StockDocument>> GetByLocationIdsAsync(IEnumerable<int> locationIds, string? status = null, string? documentType = null, string? search = null, int? productId = null, int? lotId = null, DateTime? fromDate = null, DateTime? toDate = null, int? createdByUserId = null, string? dateType = null)
        {
            var locationIdSet = locationIds.ToHashSet();

            var query = _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Where(x => (x.FromLocationId.HasValue && locationIdSet.Contains(x.FromLocationId.Value))
                         || (x.ToLocationId.HasValue && locationIdSet.Contains(x.ToLocationId.Value)));

            if (productId.HasValue)
                query = query.Where(x => x.StockTransactions.Any(t => t.ProductId == productId.Value));

            if (lotId.HasValue)
                query = query.Where(x => x.StockTransactions.Any(t => t.LotId == lotId.Value));

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(x => x.Status == status);

            if (!string.IsNullOrWhiteSpace(documentType))
                query = query.Where(x => x.DocumentType == documentType);

            if (fromDate.HasValue)
            {
                var start = fromDate.Value.Date;
                if (dateType == "completed")
                    query = query.Where(x => x.CompletedAt >= start);
                else if (dateType == "planned")
                    query = query.Where(x => x.StockTransactions.Any(t => t.PlannedDate >= start));
                else
                    query = query.Where(x => x.CreatedAt >= start);
            }

            if (toDate.HasValue)
            {
                var end = toDate.Value.Date.AddDays(1).AddTicks(-1);
                if (dateType == "completed")
                    query = query.Where(x => x.CompletedAt <= end);
                else if (dateType == "planned")
                    query = query.Where(x => x.StockTransactions.Any(t => t.PlannedDate <= end));
                else
                    query = query.Where(x => x.CreatedAt <= end);
            }

            if (createdByUserId.HasValue)
            {
                var userId = createdByUserId.Value;

                // Find reference IDs for each type where the user is the creator
                var saleOrderIds = await _context.SaleOrders
                    .Where(x => x.CreatedById == userId)
                    .Select(x => x.Id)
                    .ToListAsync();

                var transferOrderIds = await _context.TransferOrders
                    .Where(x => x.CreatedById == userId)
                    .Select(x => x.Id)
                    .ToListAsync();

                var adjustmentIds = await _context.InventoryAdjustments
                    .Where(x => x.AssigneeId == userId)
                    .Select(x => x.Id)
                    .ToListAsync();

                var purchaseOrderIds = await _context.PurchaseOrders
                    .Where(x => x.CreatedById == userId)
                    .Select(x => x.Id)
                    .ToListAsync();

                var scrapOrderIds = await _context.ScrapOrders
                    .Where(x => x.CreatedById == userId)
                    .Select(x => x.Id)
                    .ToListAsync();

                query = query.Where(x =>
                    (x.ReferenceType == StockDocumentReferenceType.SaleOrder.ToString() && x.ReferenceId.HasValue && saleOrderIds.Contains(x.ReferenceId.Value)) ||
                    (x.ReferenceType == StockDocumentReferenceType.TransferOrder.ToString() && x.ReferenceId.HasValue && transferOrderIds.Contains(x.ReferenceId.Value)) ||
                    (x.ReferenceType == StockDocumentReferenceType.InventoryAdjustment.ToString() && x.ReferenceId.HasValue && adjustmentIds.Contains(x.ReferenceId.Value)) ||
                    (x.ReferenceType == StockDocumentReferenceType.PurchaseOrder.ToString() && x.ReferenceId.HasValue && purchaseOrderIds.Contains(x.ReferenceId.Value)) ||
                    (x.ReferenceType == "scrap_order" && x.ReferenceId.HasValue && scrapOrderIds.Contains(x.ReferenceId.Value))
                );
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim().ToLower();
                query = query.Where(x =>
                    (x.DocumentNo != null && x.DocumentNo.ToLower().Contains(keyword)) ||
                    (x.DocumentType != null && x.DocumentType.ToLower().Contains(keyword)) ||
                    (x.Status != null && x.Status.ToLower().Contains(keyword)) ||
                    (x.ReferenceType != null && x.ReferenceType.ToLower().Contains(keyword)) ||
                    (x.FromLocation != null && x.FromLocation.Name != null && x.FromLocation.Name.ToLower().Contains(keyword)) ||
                    (x.ToLocation != null && x.ToLocation.Name != null && x.ToLocation.Name.ToLower().Contains(keyword))
                );
            }

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .ToListAsync();
        }

        public async Task<int> CountByStatusAndLocationIdsAsync(string status, IEnumerable<int> locationIds, string? documentType = null)
        {
            var locationIdSet = locationIds.ToHashSet();

            var query = _context.StockDocuments
                .Where(x => x.Status == status)
                .Where(x => (x.FromLocationId.HasValue && locationIdSet.Contains(x.FromLocationId.Value))
                         || (x.ToLocationId.HasValue && locationIdSet.Contains(x.ToLocationId.Value)));

            if (!string.IsNullOrWhiteSpace(documentType))
                query = query.Where(x => x.DocumentType == documentType);

            return await query.CountAsync();
        }


        public async Task<List<StockDocument>> GetAllAsync()
        {
            return await _context.StockDocuments.ToListAsync();
        }

        public async Task<StockDocument> CreateStockDocument(CreateStockDocumentDto dto)
        {
            var year = DateTime.UtcNow.Year;
            var count = await _context.StockDocuments
                                      .CountAsync(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Year == year);

            var stockDocument = new StockDocument
            {
                DocumentNo = $"ADJ-{year}-{count + 1:D3}",
                DocumentType = StockDocumentType.Adjustment.ToString(),
                ReferenceType = StockDocumentReferenceType.InventoryAdjustment.ToString(),
                ReferenceId = dto.ReferenceId,
                FromLocationId = dto.FromLocationId,
                ToLocationId = dto.ToLocationId,
                Status = StockDocumentStatus.Draft.ToString(),
                CreatedAt = DateTime.UtcNow,
            };

            await _context.StockDocuments.AddAsync(stockDocument);
            return stockDocument;
        }

        public async Task CompletedStockDocumentStatus(int id, string origin)
        {
            var stockDocument = await _context.StockDocuments.FindAsync(id);
            if (stockDocument != null)
            {
                stockDocument.Status = StockDocumentStatus.Completed.ToString();
                stockDocument.Origin = origin;
                stockDocument.CompletedAt = DateTime.UtcNow;

                _context.StockDocuments.Update(stockDocument);
            }
        }

        public async Task<StockDocument?> GetStockDocumentById(int id)
        {
            return await _context.StockDocuments.FindAsync(id);
        }

        public async Task<StockDocument?> GetStockDocumentByPoNo(string poNo)
        {
            return await _context.StockDocuments.FirstOrDefaultAsync(x => x.DocumentNo == poNo);

        }

        public async Task<StockDocument> CreateStockDocumentPurchase(StockDocument stockDocument)
        {
            await _context.StockDocuments.AddAsync(stockDocument);
            return stockDocument;
        }
        public async Task UpdateStockDocument(StockDocument doc)
        {
            _context.StockDocuments.Update(doc);
            await Task.CompletedTask;
        }
        public async Task<List<StockDocument>> GetStockDocumentByDocumentTypeAsync(string type)
        {
            if (string.IsNullOrWhiteSpace(type))
                throw new ArgumentException("DocumentType không được để trống");

            return await _context.StockDocuments
                .Where(x => x.DocumentType.Equals(type.Trim(), StringComparison.OrdinalIgnoreCase))
                .ToListAsync();
        }
        public async Task<List<StockDocument>> GetPurchaseOrderDocumentByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status không được để trống");

            return await _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Where(x => x.DocumentType == StockDocumentType.PurchaseOrder.ToString()
                         && x.Status.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .ToListAsync();
        }
        public async Task<StockDocument?> GetStockDocumentByReferenceId(int adjustmentId)
        {
            if (adjustmentId <= 0)
                throw new ArgumentException("AdjustmentId không hợp lệ");

            return await _context.StockDocuments
                .FirstOrDefaultAsync(doc => doc.ReferenceId == adjustmentId);
        }

        public async Task<IEnumerable<StockDocument>> GetDashboardTrendDataAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Where(t => t.CompletedAt != null &&
                            t.CompletedAt >= startDate.Date &&
                            t.CompletedAt <= endDate.Date.AddDays(1).AddTicks(-1) &&
                            (t.Status == "Completed" || t.Status == "done" || t.Status == "Done"))
                .ToListAsync();
        }

        public async Task<IEnumerable<StockDocument>> GetDashboardPendingDataAsync()
        {
            return await _context.StockDocuments
                .Include(x => x.FromLocation)
                .Include(x => x.ToLocation)
                .Where(t => t.CompletedAt == null && t.Status != "Cancelled")
                .ToListAsync();
        }
    }
}
