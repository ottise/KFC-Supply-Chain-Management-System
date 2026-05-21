using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class StockTransactionService : IStockTransactionService
    {
        private readonly IUnitOfWork _unitOfWork;

        public StockTransactionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<StockTransactionDto>> GetAllAsync()
        {
            var transactions = (await _unitOfWork.StockTransaction.GetAllAsync()).ToList();
            var creatorMap = await BuildCreatorInfoByDocumentIdAsync(transactions);

            return transactions.Select(t => MapTransactionDto(t, creatorMap.GetValueOrDefault(t.DocumentId)));
        }

        public async Task<IEnumerable<StockTransactionDto>> GetByDocumentIdAsync(int managerId, int documentId)
        {
            if (managerId <= 0)
                throw new BadRequestException("ManagerId is required from context.");

            if (documentId <= 0)
                throw new BadRequestException("DocumentId is invalid.");

            // Verify the document exists
            var doc = await _unitOfWork.StockDocument.GetByIdAsync(documentId);
            if (doc == null)
                throw new NotFoundException("Stock document not found.");

            // Verify manager has access to this document's locations
            var warehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(managerId)).ToList();
            if (!warehouses.Any())
                throw new BadRequestException("No warehouses found for this manager.");

            var warehouseIds = warehouses.Select(w => w.Id).ToHashSet();
            var allLocations = await _unitOfWork.Location.GetAllAsync();
            var managerLocationIds = allLocations
                .Where(l => l.WarehouseId.HasValue && warehouseIds.Contains(l.WarehouseId.Value))
                .Select(l => l.Id)
                .ToHashSet();

            var hasAccess = (doc.FromLocationId.HasValue && managerLocationIds.Contains(doc.FromLocationId.Value))
                         || (doc.ToLocationId.HasValue && managerLocationIds.Contains(doc.ToLocationId.Value));

            if (!hasAccess)
                throw new ForbiddenException("You do not have permission to view transactions of this stock document.");

            var transactions = (await _unitOfWork.StockTransaction.GetByDocumentIdAsync(documentId)).ToList();
            var creatorMap = await BuildCreatorInfoByDocumentIdAsync(transactions);

            return transactions.Select(t => MapTransactionDto(t, creatorMap.GetValueOrDefault(t.DocumentId)));
        }

        public async Task<StockTransaction> CreateStockTransaction(StockTransaction tran)
        {
            if (tran == null)
                throw new ArgumentNullException(nameof(tran));

            if (tran.ProductId <= 0)
                throw new ArgumentException("ProductId must be greater than 0");

            if (tran.PlannedQty <= 0)
                throw new ArgumentException("Planned quantity must be greater than 0");

            var result = await _unitOfWork.StockTransaction.CreateStockTransaction(tran);
            await _unitOfWork.SaveChangesAsync();
            return result;
        }

        public async Task CompleteStockTransaction(int id, decimal actualQty)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid transaction id");

            if (actualQty < 0)
                throw new ArgumentException("Actual quantity cannot be negative");

            await _unitOfWork.StockTransaction.CompleteStockTransaction(id, actualQty);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<StockTransaction> GetTransactionById(int id)
        {
            var transaction = await _unitOfWork.StockTransaction.GetTransactionById(id);
            if (transaction == null)
                throw new KeyNotFoundException($"Transaction {id} not found");

            return transaction;
        }
        public async Task<StockTransaction> CreateStockTransactionPurchase(StockTransaction transaction)
        {
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (transaction.ProductId == null || transaction.ProductId <= 0) throw new ArgumentException("Invalid ProductId");
            if (transaction.DocumentId <= 0) throw new ArgumentException("Invalid DocumentId");

            await _unitOfWork.StockTransaction.CreateStockTransactionPurchase(transaction);
            await _unitOfWork.SaveChangesAsync();
            return transaction;
        }
        public async Task<List<StockTransaction>> GetByDocumentId(int documentId)
        {
            return await _unitOfWork.StockTransaction.GetByDocumentId(documentId);
        }

        public async Task UpdateStockTransaction(StockTransaction transaction)
        {
            await _unitOfWork.StockTransaction.UpdateStockTransaction(transaction);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<IEnumerable<StockTransaction>> GetByInventoryIds(List<int> inventoryIds)
        {

            if (inventoryIds == null || !inventoryIds.Any())
                throw new ArgumentException("Danh sách inventory không được rỗng");


            var transactions = await _unitOfWork.StockTransaction.GetByInventoryIdsAsync(inventoryIds);


            if (transactions == null || !transactions.Any())
                throw new KeyNotFoundException("Không tìm thấy transaction liên quan đến danh sách inventory");

            foreach (var tx in transactions)
            {
                if (!tx.ProductId.HasValue)
                    throw new InvalidOperationException($"Transaction {tx.Id} thiếu ProductId");

                if (!tx.DocumentId.HasValue)
                    throw new InvalidOperationException($"Transaction {tx.Id} thiếu DocumentId");

                if (!tx.FromLocationId.HasValue || !tx.ToLocationId.HasValue)
                    throw new InvalidOperationException($"Transaction {tx.Id} thiếu thông tin Location");

                if (tx.PlannedQty < 0 || tx.ReservedQty < 0)
                    throw new InvalidOperationException($"Transaction {tx.Id} có số lượng không hợp lệ");
            }

            return transactions;
        }
        public async Task<StockTransaction?> GetByProductLocationLot(int productId, int locationId, int? lotId)
        {
            if (productId <= 0 || locationId <= 0)
                throw new ArgumentException("ProductId và LocationId không hợp lệ");

            var transaction = await _unitOfWork.StockTransaction.GetByProductLocationLotAsync(productId, locationId, lotId);

            if (transaction == null)
                throw new KeyNotFoundException($"Không tìm thấy Transaction cho Product {productId}, Location {locationId}, Lot {lotId}");

            if (!transaction.DocumentId.HasValue)
                throw new InvalidOperationException($"Transaction {transaction.Id} thiếu DocumentId");

            if (!transaction.ProductId.HasValue)
                throw new InvalidOperationException($"Transaction {transaction.Id} thiếu ProductId");

            return transaction;
        }
        public async Task<List<StockTransaction>> GetByProductLocationLotAllAsync(int productId, int locationId, int? lotId)
        {
            if (productId <= 0)
                throw new ArgumentException("ProductId không hợp lệ");

            if (locationId <= 0)
                throw new ArgumentException("LocationId không hợp lệ");

            var transactions = await _unitOfWork.StockTransaction.GetByProductLocationLotAll(productId, locationId, lotId);

            return transactions;
        }

        public async Task DeleteAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("Invalid transaction id");
            var transaction = await _unitOfWork.StockTransaction.GetByIdAsync(id);
            if (transaction != null)
            {
                await _unitOfWork.StockTransaction.DeleteAsync(transaction);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        private async Task<Dictionary<int?, SourceCreatorInfo>> BuildCreatorInfoByDocumentIdAsync(IEnumerable<StockTransaction> transactions)
        {
            var documentIds = transactions
                .Where(t => t.DocumentId.HasValue)
                .Select(t => t.DocumentId!.Value)
                .Distinct()
                .ToList();

            var result = new Dictionary<int?, SourceCreatorInfo>();
            if (!documentIds.Any())
                return result;

            var allDocs = await _unitOfWork.StockDocument.GetAllWithLocationsAsync();
            var docs = allDocs
                .Where(d => documentIds.Contains(d.Id) && d.ReferenceId.HasValue && !string.IsNullOrWhiteSpace(d.ReferenceType))
                .ToList();

            if (!docs.Any())
                return result;

            var saleOrderIds = docs
                .Where(d => d.ReferenceType != null && d.ReferenceType.Equals(StockDocumentReferenceType.SaleOrder.ToString(), StringComparison.OrdinalIgnoreCase))
                .Select(d => d.ReferenceId!.Value)
                .ToHashSet();

            var transferOrderIds = docs
                .Where(d => d.ReferenceType != null && d.ReferenceType.Equals(StockDocumentReferenceType.TransferOrder.ToString(), StringComparison.OrdinalIgnoreCase))
                .Select(d => d.ReferenceId!.Value)
                .ToHashSet();

            var scrapOrderIds = docs
                .Where(d => d.ReferenceType != null && d.ReferenceType.Equals("scrap_order", StringComparison.OrdinalIgnoreCase))
                .Select(d => d.ReferenceId!.Value)
                .ToHashSet();

            var adjustmentIds = docs
                .Where(d => d.ReferenceType != null && d.ReferenceType.Equals(StockDocumentReferenceType.InventoryAdjustment.ToString(), StringComparison.OrdinalIgnoreCase))
                .Select(d => d.ReferenceId!.Value)
                .ToHashSet();

            var saleOrders = (await _unitOfWork.SaleOrder.GetAllAsync())
                .Where(x => saleOrderIds.Contains(x.Id))
                .ToDictionary(x => x.Id);

            var transferOrders = (await _unitOfWork.TransferOrder.GetAllAsync())
                .Where(x => transferOrderIds.Contains(x.Id))
                .ToDictionary(x => x.Id);

            var scrapOrders = (await _unitOfWork.ScrapOrder.GetAllAsync())
                .Where(x => scrapOrderIds.Contains(x.Id))
                .ToDictionary(x => x.Id);

            var adjustments = (await _unitOfWork.InventoryAdjustment.GetAllAsync())
                .Where(x => adjustmentIds.Contains(x.Id))
                .ToDictionary(x => x.Id);

            foreach (var doc in docs)
            {
                if (doc.ReferenceType != null
                    && doc.ReferenceType.Equals(StockDocumentReferenceType.SaleOrder.ToString(), StringComparison.OrdinalIgnoreCase)
                    && saleOrders.TryGetValue(doc.ReferenceId!.Value, out var sale))
                {
                    result[doc.Id] = new SourceCreatorInfo
                    {
                        CreatedById = sale.CreatedById,
                        CreatedByName = sale.CreatedByName
                    };
                    continue;
                }

                if (doc.ReferenceType != null
                    && doc.ReferenceType.Equals(StockDocumentReferenceType.TransferOrder.ToString(), StringComparison.OrdinalIgnoreCase)
                    && transferOrders.TryGetValue(doc.ReferenceId!.Value, out var transfer))
                {
                    result[doc.Id] = new SourceCreatorInfo
                    {
                        CreatedById = transfer.CreatedById,
                        CreatedByName = transfer.CreatedByName
                    };
                    continue;
                }

                if (doc.ReferenceType != null
                    && doc.ReferenceType.Equals("scrap_order", StringComparison.OrdinalIgnoreCase)
                    && scrapOrders.TryGetValue(doc.ReferenceId!.Value, out var scrap))
                {
                    result[doc.Id] = new SourceCreatorInfo
                    {
                        CreatedById = scrap.CreatedById,
                        CreatedByName = scrap.CreatedByName
                    };
                    continue;
                }

                if (doc.ReferenceType != null
                    && doc.ReferenceType.Equals(StockDocumentReferenceType.InventoryAdjustment.ToString(), StringComparison.OrdinalIgnoreCase)
                    && adjustments.TryGetValue(doc.ReferenceId!.Value, out var adjustment))
                {
                    result[doc.Id] = new SourceCreatorInfo
                    {
                        CreatedById = adjustment.AssigneeId,
                        CreatedByName = null
                    };
                }
            }

            return result;
        }

        private static StockTransactionDto MapTransactionDto(StockTransaction t, SourceCreatorInfo? creatorInfo)
        {
            return new StockTransactionDto
            {
                Id = t.Id,
                DocumentId = t.DocumentId,
                ProductId = t.ProductId,
                ProductName = t.Product?.Name,
                UomId = t.UomId,
                UomName = t.Uom?.Name,
                FromLocationId = t.FromLocationId,
                FromLocationName = t.FromLocation?.Name,
                ToLocationId = t.ToLocationId,
                ToLocationName = t.ToLocation?.Name,
                PlannedQty = t.PlannedQty,
                ActualQty = t.ActualQty,
                ReservedQty = t.ReservedQty,
                LotId = t.LotId,
                LotName = t.Lot?.LotNumber,
                TransactionType = t.TransactionType,
                Status = t.Status,
                CreatedById = creatorInfo?.CreatedById,
                CreatedByName = creatorInfo?.CreatedByName,
                CreatedAt = t.CreatedAt,
                CompletedAt = t.CompletedAt,
                PlannedDate = t.PlannedDate
            };
        }

        private sealed class SourceCreatorInfo
        {
            public int? CreatedById { get; init; }
            public string? CreatedByName { get; init; }
        }
    }
}
