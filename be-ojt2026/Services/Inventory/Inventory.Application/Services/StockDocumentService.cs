using System.Collections.Generic;
using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class StockDocumentService : IStockDocumentService
    {
        private static readonly string Pending = StockDocumentStatus.Pending.ToString().ToLowerInvariant();
        private static readonly string Done = StockDocumentStatus.Done.ToString().ToLowerInvariant();
        private static readonly string Cancelled = StockDocumentStatus.Cancelled.ToString().ToLowerInvariant();

        private readonly IUnitOfWork _unitOfWork;

        public StockDocumentService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedResultDto<StockDocumentListItemDto>> GetStockDocumentsAsync(int managerId, string? status, string? documentType, string? search, int? warehouseId, int? locationId, int page = 1, int pageSize = 5, int? productId = null, int? lotId = null, DateTime? fromDate = null, DateTime? toDate = null, int? createdByUserId = null, string? dateType = null)
        {
            if (page <= 0)
                throw new BadRequestException("page must be greater than 0.");

            if (pageSize <= 0)
                throw new BadRequestException("pageSize must be greater than 0.");

            if (warehouseId.HasValue && warehouseId <= 0)
                throw new BadRequestException("warehouseId must be greater than 0.");

            if (locationId.HasValue && locationId <= 0)
                throw new BadRequestException("locationId must be greater than 0.");

            var normalizedDocumentType = NormalizeDocumentType(documentType);
            var selectedStatuses = ParseStatuses(status);
            IEnumerable<StockDocument> docs = await GetFilteredDocsAsync(managerId, normalizedDocumentType, search, warehouseId, locationId, productId, lotId, fromDate, toDate, createdByUserId, dateType);

            if (selectedStatuses.Any())
            {
                docs = docs.Where(x => !string.IsNullOrWhiteSpace(x.Status)
                    && selectedStatuses.Contains(x.Status!.Trim().ToLowerInvariant()));
            }

            var filteredDocs = docs.ToList();
            var totalItems = filteredDocs.Count;
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

            var creatorMap = await BuildCreatorInfoMapAsync(filteredDocs);

            var items = filteredDocs
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => MapListItem(d, creatorMap.GetValueOrDefault(d.Id)))
                .ToList();

            return new PagedResultDto<StockDocumentListItemDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                HasNext = page < totalPages,
                HasPrevious = page > 1 && totalItems > 0
            };
        }

        public async Task<StockDocumentDetailDto> GetStockDocumentByIdAsync(int managerId, int id)
        {
            var doc = await GetDocumentWithDetailsOrThrow(id);

            // Verify manager has access to this document
            var locationIds = await GetManagerLocationIdsAsync(managerId);
            var locationIdSet = locationIds.ToHashSet();

            var hasAccess = (doc.FromLocationId.HasValue && locationIdSet.Contains(doc.FromLocationId.Value))
                         || (doc.ToLocationId.HasValue && locationIdSet.Contains(doc.ToLocationId.Value));

            if (!hasAccess)
                throw new ForbiddenException("You do not have permission to view this stock document.");

            // For TransferOrder (phiếu điều chuyển) that is not completed/cancelled yet:
            // "Kế hoạch" shown on FE should reflect what can be transferred now based on current inventory.
            // We cap PlannedQty by current available qty (Quantity - ReservedQuantity) at the source location.
            if (!string.IsNullOrWhiteSpace(doc.DocumentType)
                && string.Equals(doc.DocumentType, StockDocumentType.TransferOrder.ToString(), StringComparison.OrdinalIgnoreCase)
                && !string.Equals(doc.Status, Done, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(doc.Status, Cancelled, StringComparison.OrdinalIgnoreCase))
            {
                foreach (var tx in doc.StockTransactions ?? Enumerable.Empty<StockTransaction>())
                {
                    if (!tx.ProductId.HasValue || tx.ProductId.Value <= 0) continue;
                    if (!tx.FromLocationId.HasValue || tx.FromLocationId.Value <= 0) continue;

                    var planned = tx.PlannedQty;
                    if (planned <= 0) continue;

                    decimal available;

                    if (tx.LotId.HasValue && tx.LotId.Value > 0)
                    {
                        var currentInv = await _unitOfWork.CurrentInventory
                            .GetCurrentInventoryByLotIdAndProductIdAndLocationId(
                                tx.ProductId.Value,
                                tx.LotId.Value,
                                tx.FromLocationId.Value);

                        var qty = currentInv?.Quantity ?? 0m;
                        var reserved = currentInv?.ReservedQuantity ?? 0m;
                        available = qty - reserved;
                    }
                    else
                    {
                        var inventories = await _unitOfWork.CurrentInventory
                            .GetAvailableByProductLocationAsync(tx.ProductId.Value, tx.FromLocationId.Value);

                        available = inventories.Sum(x => (x.Quantity ?? 0m) - (x.ReservedQuantity ?? 0m));
                    }

                    if (available < 0m) available = 0m;
                    tx.PlannedQty = planned > available ? available : planned;
                }
            }

            var creatorMap = await BuildCreatorInfoMapAsync(new List<StockDocument> { doc });
            return MapDetail(doc, creatorMap.GetValueOrDefault(doc.Id));
        }

        public async Task<StockDocumentStatusCountDto> GetStatusCountAsync(int managerId, string? documentType, string? search = null, int? warehouseId = null, int? locationId = null)
        {
            var normalizedDocumentType = NormalizeDocumentType(documentType);

            var docs = await GetFilteredDocsAsync(managerId, normalizedDocumentType, search, warehouseId, locationId);

            return new StockDocumentStatusCountDto
            {
                Pending = docs.Count(x => !string.IsNullOrWhiteSpace(x.Status) && x.Status!.Trim().Equals(Pending, StringComparison.OrdinalIgnoreCase)),
                Done = docs.Count(x => !string.IsNullOrWhiteSpace(x.Status) && x.Status!.Trim().Equals(Done, StringComparison.OrdinalIgnoreCase)),
                Cancelled = docs.Count(x => !string.IsNullOrWhiteSpace(x.Status) && x.Status!.Trim().Equals(Cancelled, StringComparison.OrdinalIgnoreCase))
            };
        }

        // ===== PRIVATE HELPERS =====

        private async Task<List<StockDocument>> GetFilteredDocsAsync(int managerId, string? normalizedDocumentType, string? search, int? warehouseId, int? locationId, int? productId = null, int? lotId = null, DateTime? fromDate = null, DateTime? toDate = null, int? createdByUserId = null, string? dateType = null)
        {
            var locationIds = await GetManagerLocationIdsAsync(managerId, warehouseId, locationId);
            var normalizedSearch = string.IsNullOrWhiteSpace(search) ? null : search.Trim();

            var docs = await _unitOfWork.StockDocument.GetByLocationIdsAsync(
                locationIds,
                status: null,
                documentType: normalizedDocumentType,
                search: normalizedSearch,
                productId: productId,
                lotId: lotId,
                fromDate: fromDate,
                toDate: toDate,
                createdByUserId: createdByUserId,
                dateType: dateType);

            return docs.ToList();
        }

        private async Task<List<int>> GetManagerLocationIdsAsync(int managerId, int? warehouseId = null, int? locationId = null)
        {
            if (managerId <= 0)
                throw new BadRequestException("ManagerId is required from context.");

            var warehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(managerId)).ToList();
            if (!warehouses.Any())
                throw new BadRequestException("No warehouses found for this manager.");

            if (warehouseId.HasValue)
            {
                warehouses = warehouses.Where(w => w.Id == warehouseId.Value).ToList();
                if (!warehouses.Any())
                    throw new ForbiddenException("You do not have permission to access this warehouse.");
            }

            var warehouseIds = warehouses.Select(w => w.Id).ToHashSet();

            var allLocations = await _unitOfWork.Location.GetAllAsync();
            var managerLocations = allLocations
                .Where(l => l.WarehouseId.HasValue && warehouseIds.Contains(l.WarehouseId.Value));

            if (locationId.HasValue)
            {
                managerLocations = managerLocations.Where(l => l.Id == locationId.Value);
            }

            var locationIds = managerLocations
                .Select(l => l.Id)
                .ToList();

            if (locationId.HasValue && !locationIds.Any())
                throw new ForbiddenException("You do not have permission to access this location.");

            return locationIds;
        }

        private static HashSet<string> ParseStatuses(string? status)
        {
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                Pending,
                Done,
                Cancelled
            };

            if (string.IsNullOrWhiteSpace(status))
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            return status
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => s.Trim().ToLowerInvariant())
                .Where(allowed.Contains)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }

        private static string? NormalizeDocumentType(string? documentType)
        {
            if (string.IsNullOrWhiteSpace(documentType))
                return null;

            var normalized = documentType.Trim();
            if (normalized != StockDocumentType.SaleOrder.ToString() && normalized != StockDocumentType.TransferOrder.ToString())
                throw new BadRequestException($"documentType must be '{StockDocumentType.SaleOrder}' or '{StockDocumentType.TransferOrder}'.");

            return normalized;
        }

        private async Task<StockDocument> GetDocumentWithDetailsOrThrow(int id)
        {
            if (id <= 0) throw new BadRequestException("Id is invalid.");
            var doc = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(id);
            if (doc == null) throw new NotFoundException("Stock document not found.");
            return doc;
        }

        private static StockDocumentListItemDto MapListItem(StockDocument d, SourceCreatorInfo? creatorInfo)
        {
            return new StockDocumentListItemDto
            {
                Id = d.Id,
                DocumentNo = d.DocumentNo,
                DocumentType = d.DocumentType,
                Status = d.Status,
                Origin = d.Origin,
                FromLocationId = d.FromLocationId,
                FromLocationName = d.FromLocation?.Name,
                ToLocationId = d.ToLocationId,
                ToLocationName = d.ToLocation?.Name,
                CreatedById = creatorInfo?.CreatedById,
                CreatedByName = creatorInfo?.CreatedByName,
                CreatedAt = d.CreatedAt,
                CompletedAt = d.CompletedAt
            };
        }

        private static StockDocumentDetailDto MapDetail(StockDocument d, SourceCreatorInfo? creatorInfo)
        {
            return new StockDocumentDetailDto
            {
                Id = d.Id,
                DocumentNo = d.DocumentNo,
                DocumentType = d.DocumentType,
                ReferenceType = d.ReferenceType,
                ReferenceId = d.ReferenceId,
                Origin = d.Origin,
                FromLocationId = d.FromLocationId,
                FromLocationName = d.FromLocation?.Name,
                ToLocationId = d.ToLocationId,
                ToLocationName = d.ToLocation?.Name,
                CreatedById = creatorInfo?.CreatedById,
                CreatedByName = creatorInfo?.CreatedByName,
                Status = d.Status,
                CreatedAt = d.CreatedAt,
                CompletedAt = d.CompletedAt,
                Items = d.StockTransactions
                    .OrderBy(x => x.Id)
                    .Select(i => new StockDocumentItemDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product?.Name,
                        UomId = i.UomId,
                        UomName = i.Uom?.Name,
                        FromLocationId = i.FromLocationId,
                        FromLocationName = i.FromLocation?.Name,
                        ToLocationId = i.ToLocationId,
                        ToLocationName = i.ToLocation?.Name,
                        LotId = i.LotId,
                        LotNumber = i.Lot?.LotNumber,
                        PlannedQty = i.PlannedQty,
                        ReservedQty = i.ReservedQty,
                        ActualQty = i.ActualQty,
                        Status = i.Status,
                        PlannedDate = i.PlannedDate
                    })
                    .ToList()
            };
        }

        private async Task<Dictionary<int, SourceCreatorInfo>> BuildCreatorInfoMapAsync(IEnumerable<StockDocument> documents)
        {
            var docList = documents.ToList();
            var result = new Dictionary<int, SourceCreatorInfo>();

            var docRefs = docList
                .Where(d => d.ReferenceId.HasValue && !string.IsNullOrWhiteSpace(d.ReferenceType))
                .Select(d => new
                {
                    DocumentId = d.Id,
                    ReferenceId = d.ReferenceId!.Value,
                    ReferenceType = NormalizeReferenceType(d.ReferenceType)
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.ReferenceType))
                .ToList();

            if (!docRefs.Any())
                return result;

            var saleOrderIds = docRefs
                .Where(x => x.ReferenceType == StockDocumentReferenceType.SaleOrder.ToString())
                .Select(x => x.ReferenceId)
                .ToHashSet();

            var transferOrderIds = docRefs
                .Where(x => x.ReferenceType == StockDocumentReferenceType.TransferOrder.ToString())
                .Select(x => x.ReferenceId)
                .ToHashSet();

            var scrapOrderIds = docRefs
                .Where(x => x.ReferenceType == "scrap_order")
                .Select(x => x.ReferenceId)
                .ToHashSet();

            var adjustmentIds = docRefs
                .Where(x => x.ReferenceType == StockDocumentReferenceType.InventoryAdjustment.ToString())
                .Select(x => x.ReferenceId)
                .ToHashSet();

            var purchaseOrderIds = docRefs
                .Where(x => x.ReferenceType == StockDocumentReferenceType.PurchaseOrder.ToString())
                .Select(x => x.ReferenceId)
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

            var purchaseOrders = (await _unitOfWork.PurchaseOrder.GetAllAsync())
                .Where(x => purchaseOrderIds.Contains(x.Id))
                .ToDictionary(x => x.Id);


            foreach (var docRef in docRefs)
            {
                if (docRef.ReferenceType == StockDocumentReferenceType.SaleOrder.ToString()
                    && saleOrders.TryGetValue(docRef.ReferenceId, out var sale))
                {
                    result[docRef.DocumentId] = new SourceCreatorInfo
                    {
                        CreatedById = sale.CreatedById,
                        CreatedByName = sale.CreatedByName
                    };
                    continue;
                }

                if (docRef.ReferenceType == StockDocumentReferenceType.TransferOrder.ToString()
                    && transferOrders.TryGetValue(docRef.ReferenceId, out var transfer))
                {
                    result[docRef.DocumentId] = new SourceCreatorInfo
                    {
                        CreatedById = transfer.CreatedById,
                        CreatedByName = transfer.CreatedByName
                    };
                    continue;
                }

                if (docRef.ReferenceType == "scrap_order"
                    && scrapOrders.TryGetValue(docRef.ReferenceId, out var scrap))
                {
                    result[docRef.DocumentId] = new SourceCreatorInfo
                    {
                        CreatedById = scrap.CreatedById,
                        CreatedByName = scrap.CreatedByName
                    };
                    continue;
                }

                if (docRef.ReferenceType == StockDocumentReferenceType.InventoryAdjustment.ToString()
                    && adjustments.TryGetValue(docRef.ReferenceId, out var adjustment))
                {
                    result[docRef.DocumentId] = new SourceCreatorInfo
                    {
                        CreatedById = adjustment.AssigneeId,
                        CreatedByName = null
                    };
                    continue;
                }

                if (docRef.ReferenceType == StockDocumentReferenceType.PurchaseOrder.ToString()
                    && purchaseOrders.TryGetValue(docRef.ReferenceId, out var purchaseOrder))
                {
                    result[docRef.DocumentId] = new SourceCreatorInfo
                    {
                        CreatedById = purchaseOrder.CreatedById,
                        CreatedByName = null
                    };
                }
            }

            return result;
        }

        private static string? NormalizeReferenceType(string? referenceType)
        {
            if (string.IsNullOrWhiteSpace(referenceType))
                return null;

            var value = referenceType.Trim();

            if (value.Equals("scrap_order", StringComparison.OrdinalIgnoreCase))
                return "scrap_order";

            if (value.Equals(StockDocumentReferenceType.SaleOrder.ToString(), StringComparison.OrdinalIgnoreCase))
                return StockDocumentReferenceType.SaleOrder.ToString();

            if (value.Equals(StockDocumentReferenceType.TransferOrder.ToString(), StringComparison.OrdinalIgnoreCase))
                return StockDocumentReferenceType.TransferOrder.ToString();

            if (value.Equals(StockDocumentReferenceType.InventoryAdjustment.ToString(), StringComparison.OrdinalIgnoreCase))
                return StockDocumentReferenceType.InventoryAdjustment.ToString();

            if (value.Equals(StockDocumentReferenceType.PurchaseOrder.ToString(), StringComparison.OrdinalIgnoreCase))
                return StockDocumentReferenceType.PurchaseOrder.ToString();

            return value;
        }

        private sealed class SourceCreatorInfo
        {
            public int? CreatedById { get; init; }
            public string? CreatedByName { get; init; }
        }

        public async Task<StockDocument> CreateStockDocument(CreateStockDocumentDto dto)
        {
            if (dto.ReferenceId <= 0)
                throw new ArgumentException("ReferenceId must be greater than 0");

            if (dto.FromLocationId <= 0)
                throw new ArgumentException("LocationId must be greater than 0");

            var doc = await _unitOfWork.StockDocument.CreateStockDocument(dto);
            await _unitOfWork.SaveChangesAsync();
            return doc;
        }

        public async Task CompleteStockDocument(int id, string origin)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid document id");

            await _unitOfWork.StockDocument.CompletedStockDocumentStatus(id, origin);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<StockDocument> GetStockDocumentById(int id)
        {
            var doc = await _unitOfWork.StockDocument.GetStockDocumentById(id);
            if (doc == null)
                throw new KeyNotFoundException($"StockDocument {id} not found");

            return doc;
        }
        public async Task<StockDocument?> GetStockDocumentByPoNo(string poNo)
        {
            if (string.IsNullOrWhiteSpace(poNo)) throw new ArgumentException("PoNo cannot be empty");
            return await _unitOfWork.StockDocument.GetStockDocumentByPoNo(poNo);
        }

        public async Task<StockDocument> CreateStockDocumentPurchase(StockDocument stockDocument)
        {
            if (stockDocument == null) throw new ArgumentNullException(nameof(stockDocument));
            if (string.IsNullOrWhiteSpace(stockDocument.DocumentNo)) throw new ArgumentException("DocumentNo cannot be empty");

            await _unitOfWork.StockDocument.CreateStockDocumentPurchase(stockDocument);
            await _unitOfWork.SaveChangesAsync();
            return stockDocument;
        }
        public async Task<List<StockDocument>> GetAllAsync()
        {
            return await _unitOfWork.StockDocument.GetAllAsync();
        }
        public async Task UpdateStockDocument(StockDocument doc)
        {
            if (doc == null) throw new ArgumentNullException(nameof(doc));

            await _unitOfWork.StockDocument.UpdateStockDocument(doc);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("Id must be greater than zero.");
            var doc = await _unitOfWork.StockDocument.GetByIdAsync(id);
            if (doc == null) throw new KeyNotFoundException($"StockDocument {id} not found.");

            await _unitOfWork.StockDocument.DeleteAsync(doc);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<List<StockDocument>> GetStockDocumentsByTypeAsync(string type, int? managerId, int userId)
        {
            if (string.IsNullOrWhiteSpace(type))
                throw new ArgumentException("DocumentType không được để trống");

            var effectiveManagerId = managerId.HasValue && managerId.Value > 0
                ? managerId.Value
                : userId;

            var warehouse = await _unitOfWork.Warehouse.GetWarehouseByManagerIdAsync(effectiveManagerId);
            if (warehouse == null)
                throw new UnauthorizedAccessException("Không tìm thấy warehouse cho manager/user này");

            var locations = await _unitOfWork.Location.GetLocationByWarehouseIdAsync(warehouse.Id);
            if (locations == null || !locations.Any())
                throw new UnauthorizedAccessException("Manager/User không có quyền ở bất kỳ location nào");

            var documents = await _unitOfWork.StockDocument.GetStockDocumentByDocumentTypeAsync(type);

            var filteredDocs = documents
                .Where(d => locations.Any(l => l.Id == d.ToLocationId || l.Id == d.FromLocationId))
                .ToList();

            if (!filteredDocs.Any())
                throw new KeyNotFoundException($"Không tìm thấy chứng từ loại {type} trong warehouse/location của manager/user {effectiveManagerId}");

            return filteredDocs;
        }
        public async Task<List<StockDocument>> GetPurchaseOrderDocumentsByStatusAsync(string status, int? managerId, int userId)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status không được để trống");

            var effectiveManagerId = managerId.HasValue && managerId.Value > 0
                ? managerId.Value
                : userId;


            var warehouse = await _unitOfWork.Warehouse.GetWarehouseByManagerIdAsync(effectiveManagerId);
            if (warehouse == null)
                throw new UnauthorizedAccessException("Không tìm thấy warehouse cho manager/user này");

            var locations = await _unitOfWork.Location.GetLocationByWarehouseIdAsync(warehouse.Id);
            if (locations == null || !locations.Any())
                throw new UnauthorizedAccessException("Manager/User không có quyền ở bất kỳ location nào");


            var documents = await _unitOfWork.StockDocument.GetStockDocumentByDocumentTypeAsync(StockDocumentType.PurchaseOrder.ToString());


            var filteredDocs = documents
                .Where(d => d.Status.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase)
                         && locations.Any(l => l.Id == d.ToLocationId || l.Id == d.FromLocationId))
                .ToList();

            if (!filteredDocs.Any())
                throw new KeyNotFoundException($"Không tìm thấy chứng từ PurchaseOrder với status {status} trong warehouse/location của manager/user {effectiveManagerId}");

            return filteredDocs;
        }
        public async Task<StockDocument> GetStockDocumentByReferenceId(int adjustmentId)
        {
            if (adjustmentId <= 0)
                throw new ArgumentException("AdjustmentId không hợp lệ");

            var stockDoc = await _unitOfWork.StockDocument.GetStockDocumentByReferenceId(adjustmentId);
            if (stockDoc == null)
                throw new KeyNotFoundException($"Không tìm thấy StockDocument cho Adjustment {adjustmentId}");

            return stockDoc;
        }

    }
}
