using BuildingBlocks.Exceptions;
using BuildingBlocks.Utils;
using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ScrapOrder;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services;

public class ScrapOrderService : IScrapOrderService
{
    private static readonly string Draft = ScrapOrderStatus.Draft.ToString().ToLowerInvariant();
    private static readonly string Ready = ScrapOrderStatus.Ready.ToString().ToLowerInvariant();
    private static readonly string Done = ScrapOrderStatus.Done.ToString().ToLowerInvariant();
    private static readonly string Cancelled = ScrapOrderStatus.Cancelled.ToString().ToLowerInvariant();
    private static readonly string StockPending = StockDocumentStatus.Pending.ToString().ToLowerInvariant();
    private const string ScrapWarehouseCode = "VWH_SCRAP";

    private readonly IUnitOfWork _unitOfWork;

    public ScrapOrderService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

        public async Task<PagedResultDto<ScrapOrderListItemDto>> GetAllAsync(
            int? managerId,
            int? userId,
            string? status,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default,
            string? scrapNo = null,
            string? locationName = null,
            string? createdBy = null)
        {
            if (page <= 0) throw new BadRequestException("page must be greater than 0.");
            if (pageSize <= 0) throw new BadRequestException("pageSize must be greater than 0.");

            var all = await _unitOfWork.ScrapOrder.GetAllAsync(cancellationToken);
            var list = all.AsEnumerable();

            int? effectiveManagerId = managerId;
            if (!effectiveManagerId.HasValue && userId.HasValue)
                effectiveManagerId = userId;

            if (effectiveManagerId.HasValue)
            {
                var managerWarehouses = await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId.Value);
                var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();

                list = list.Where(x => managerWarehouseIds.Contains(x.WarehouseId));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalized = status.Trim().ToLowerInvariant();
                list = list.Where(x => x.Status != null && x.Status.Equals(normalized, StringComparison.OrdinalIgnoreCase));
            }

            var hasScrapNo = !string.IsNullOrWhiteSpace(scrapNo);
            var hasLocationName = !string.IsNullOrWhiteSpace(locationName);
            var hasCreatedBy = !string.IsNullOrWhiteSpace(createdBy);

            if (hasScrapNo || hasLocationName || hasCreatedBy)
            {
                var scrapNoTerm = TextNormalizer.NormalizeForSearch(scrapNo);
                var locationTerm = TextNormalizer.NormalizeForSearch(locationName);
                var createdByTerm = TextNormalizer.NormalizeForSearch(createdBy);

                list = list.Where(x =>
                    (hasScrapNo && TextNormalizer.NormalizeForSearch(x.ScrapNo).Contains(scrapNoTerm, StringComparison.Ordinal))
                    || (hasLocationName && (
                        TextNormalizer.NormalizeForSearch(x.Location?.Name).Contains(locationTerm, StringComparison.Ordinal)
                        || TextNormalizer.NormalizeForSearch(x.Warehouse?.Name).Contains(locationTerm, StringComparison.Ordinal)))
                    || (hasCreatedBy && TextNormalizer.NormalizeForSearch(x.CreatedByName).Contains(createdByTerm, StringComparison.Ordinal))
                );
            }

            var filtered = list.ToList();
            var totalItems = filtered.Count;
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

            var items = filtered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(MapListItem)
                .ToList();

            return new PagedResultDto<ScrapOrderListItemDto>
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

    public async Task<ScrapOrderDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await GetOrderWithItemsOrThrow(id, cancellationToken);
        var stockDoc = await FindLinkedStockDocument(id, cancellationToken);
        return MapDetail(order, stockDoc?.Id);
    }

    public async Task<ScrapOrderStatusCountDto> GetStatusCountAsync(int? managerId, int? userId, CancellationToken cancellationToken = default)
    {
        var all = await _unitOfWork.ScrapOrder.GetAllAsync(cancellationToken);
        var list = all.AsEnumerable();

        int? effectiveManagerId = managerId;
        if (!effectiveManagerId.HasValue && userId.HasValue)
            effectiveManagerId = userId;

        if (effectiveManagerId.HasValue)
        {
            var managerWarehouses = await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId.Value);
            var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();
            list = list.Where(x => managerWarehouseIds.Contains(x.WarehouseId));
        }

        return new ScrapOrderStatusCountDto
        {
            Draft = list.Count(x => x.Status != null && x.Status.Equals(Draft, StringComparison.OrdinalIgnoreCase)),
            Ready = list.Count(x => x.Status != null && x.Status.Equals(Ready, StringComparison.OrdinalIgnoreCase)),
            Done = list.Count(x => x.Status != null && x.Status.Equals(Done, StringComparison.OrdinalIgnoreCase)),
            Cancelled = list.Count(x => x.Status != null && x.Status.Equals(Cancelled, StringComparison.OrdinalIgnoreCase))
        };
    }

        public async Task<ScrapOrderDetailDto> CreateAsync(int managerId, string createdByName, CreateScrapOrderDto dto, CancellationToken cancellationToken = default)
        {
            if (managerId <= 0) throw new BadRequestException("ManagerId is required from context.");
            if (dto.WarehouseId <= 0) throw new BadRequestException("WarehouseId is required.");
            if (dto.LocationId <= 0) throw new BadRequestException("LocationId is required.");
            if (dto.Item == null) throw new BadRequestException("Scrap order item is required.");

            var now = DateTime.UtcNow;

            // 1. Lấy danh sách kho cùng manager
            var managerWarehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(managerId)).ToList();
            var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();
            if (!managerWarehouseIds.Any())
                throw new BadRequestException("No warehouses found for this manager.");

            // 2. Validate warehouse + location thuộc kho cùng manager
            if (!managerWarehouseIds.Contains(dto.WarehouseId))
                throw new BadRequestException("Warehouse must belong to one of the warehouses managed by the staff's manager.");

            var location = await _unitOfWork.Location.GetByIdAsync(dto.LocationId);
            if (location == null) throw new NotFoundException("Location not found.");
            if (!location.WarehouseId.HasValue || !managerWarehouseIds.Contains(location.WarehouseId.Value))
                throw new BadRequestException("Location must belong to one of the warehouses managed by the staff's manager.");

            if (location.WarehouseId.Value != dto.WarehouseId)
                throw new BadRequestException("Location must belong to the provided warehouse.");

            if (location.WarehouseId.Value != dto.WarehouseId)
                throw new BadRequestException("Location must belong to the provided warehouse.");

            await ValidateProduct(dto.Item.ProductId);
            if (dto.Item.Quantity <= 0) throw new BadRequestException("Quantity must be greater than 0.");
            if (dto.Item.UomId <= 0) throw new BadRequestException("UomId is required.");
            if (dto.Item.LotId <= 0) throw new BadRequestException("LotId is required.");

        var scrapNo = await GenerateScrapNoAsync(cancellationToken);
        var scrapLocationId = await GetVirtualScrapLocationIdAsync();

            var order = new ScrapOrder
            {
                ScrapNo = scrapNo,
                WarehouseId = dto.WarehouseId,
                LocationId = dto.LocationId,
                ToLocationId = scrapLocationId,
                Status = Draft,
                CreatedAt = now,
                CreatedByName = createdByName,
                CreatedById = managerId // Store the ID of the person who created it
            };

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                await ValidateLot(dto.Item.LotId);

                await _unitOfWork.ScrapOrder.AddAsync(order, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                var item = new ScrapOrderItem
                {
                    ScrapOrderId = order.Id,
                    ProductId = dto.Item.ProductId,
                    Quantity = dto.Item.Quantity,
                    UomId = dto.Item.UomId,
                    LotId = dto.Item.LotId,
                    Reason = dto.Item.Reason
                };
                order.ScrapOrderItems.Add(item);
                await _unitOfWork.ScrapOrder.UpdateAsync(order);

                // Tạo StockDocument liên kết
                var stockDoc = new StockDocument
                {
                    DocumentNo = scrapNo,
                    DocumentType = "scrap_order",
                    ReferenceType = "scrap_order",
                    ReferenceId = order.Id,
                    Origin = $"Scrap Order {scrapNo}",
                    FromLocationId = dto.LocationId,
                    ToLocationId = scrapLocationId,
                    Status = StockPending,
                    CreatedAt = now
                };
                await _unitOfWork.StockDocument.AddAsync(stockDoc);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Tạo StockTransactions
                var createdOrder = await GetOrderWithItemsOrThrow(order.Id, cancellationToken);
                var createdItem = createdOrder.ScrapOrderItems.First();
                var transaction = new StockTransaction
                {
                    DocumentId = stockDoc.Id,
                    ProductId = (int)createdItem.ProductId!,
                    UomId = (int)createdItem.UomId!,
                    FromLocationId = dto.LocationId,
                    ToLocationId = scrapLocationId,
                    LotId = createdItem.LotId!,
                    PlannedQty = createdItem.Quantity ?? 0,
                    ActualQty = 0,
                    ReservedQty = 0,
                    TransactionType = "scrap_order",
                    Status = StockPending,
                    CreatedAt = now,
                    PlannedDate = now.Date
                };
                await _unitOfWork.StockTransaction.AddAsync(transaction);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                return MapDetail(createdOrder, stockDoc.Id);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }

    public async Task<ScrapOrderDetailDto> CheckAvailabilityAsync(int managerId, int id, CancellationToken cancellationToken = default)
    {
        if (managerId <= 0) throw new BadRequestException("ManagerId is required from context.");

        var order = await GetOrderWithItemsOrThrow(id, cancellationToken);
        if (order.Status != Draft)
            throw new BadRequestException("Can only check availability from Draft status.");

        await EnsureManagerAccessAsync(order.WarehouseId, order.LocationId, managerId);

        var stockDoc = await FindLinkedStockDocument(id, cancellationToken);
        if (stockDoc != null)
        {
            var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
            if (docDetail != null)
            {
                docDetail.Status = StockPending;
                await _unitOfWork.StockDocument.UpdateAsync(docDetail);

                foreach (var t in docDetail.StockTransactions)
                {
                    t.Status = StockPending;
                    await _unitOfWork.StockTransaction.UpdateAsync(t);
                }
            }
        }

        if (!order.ScrapOrderItems.Any())
            throw new BadRequestException("Scrap order must have at least one item.");

        foreach (var item in order.ScrapOrderItems)
        {
            if (!item.ProductId.HasValue || !item.LotId.HasValue)
                throw new BadRequestException("ProductId and LotId are required for scrap items.");

            var inventory = await _unitOfWork.CurrentInventory.GetByProductLocationLotAsync(
                item.ProductId.Value, order.LocationId, item.LotId);

            var qty = item.Quantity ?? 0;
            var actualQty = inventory?.Quantity ?? 0;
            var reservedQty = inventory?.ReservedQuantity ?? 0;
            var availableQty = actualQty - reservedQty;

            if (inventory == null)
                throw new BadRequestException($"Không đủ hàng cho sản phẩm {item.ProductId} ở lot {item.LotId}. Tồn khả dụng: {availableQty}, tồn thực tế: {actualQty}, đã giữ: {reservedQty}, yêu cầu: {qty}.");

            if (availableQty < qty)
                throw new BadRequestException($"Không đủ hàng cho sản phẩm {item.ProductId} ở lot {item.LotId}. Tồn khả dụng: {availableQty}, tồn thực tế: {actualQty}, đã giữ: {reservedQty}, yêu cầu: {qty}.");
        }

        order.Status = Ready;
        order.ConfirmedAt = DateTime.UtcNow;
        await _unitOfWork.ScrapOrder.UpdateAsync(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapDetail(order, stockDoc?.Id);
    }

    public async Task<ScrapOrderDetailDto> MarkDoneAsync(int managerId, int id, CancellationToken cancellationToken = default)
    {
        if (managerId <= 0) throw new BadRequestException("ManagerId is required from context.");

        var order = await GetOrderWithItemsOrThrow(id, cancellationToken);
        if (order.Status != Ready)
            throw new BadRequestException("Scrap order must be ready before completing.");

        await EnsureManagerAccessAsync(order.WarehouseId, order.LocationId, managerId);

        if (!order.ScrapOrderItems.Any())
            throw new BadRequestException("Scrap order must have at least one item.");

        var stockDoc = await FindLinkedStockDocument(id, cancellationToken);
        if (stockDoc == null)
            throw new BadRequestException("Linked stock document not found.");

        var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
        if (docDetail == null)
            throw new BadRequestException("Stock document details not found.");

        var now = DateTime.UtcNow;

        foreach (var item in order.ScrapOrderItems)
        {
            if (!item.ProductId.HasValue || !item.LotId.HasValue)
                throw new BadRequestException("ProductId and LotId are required for scrap items.");

            var inventory = await _unitOfWork.CurrentInventory.GetByProductLocationLotAsync(
                item.ProductId.Value, order.LocationId, item.LotId);

            if (inventory == null)
                throw new BadRequestException($"Lot {item.LotId} does not exist for product {item.ProductId}.");

            var qty = item.Quantity ?? 0;
            var availableQty = (inventory.Quantity ?? 0) - (inventory.ReservedQuantity ?? 0);
            if (availableQty < qty)
                throw new BadRequestException($"Insufficient available quantity for product {item.ProductId} in lot {item.LotId}. Available: {availableQty}, required: {qty}.");

            inventory.Quantity = (inventory.Quantity ?? 0) - qty;
            await _unitOfWork.CurrentInventory.UpdateAsync(inventory);

            // 2. Add stock to target (scrap) location
            if (order.ToLocationId.HasValue)
            {
                var targetInventory = await _unitOfWork.CurrentInventory.GetByProductLocationLotAsync(
                    item.ProductId.Value, order.ToLocationId.Value, item.LotId);

                if (targetInventory != null)
                {
                    targetInventory.Quantity = (targetInventory.Quantity ?? 0) + qty;
                    await _unitOfWork.CurrentInventory.UpdateAsync(targetInventory);
                }
                else
                {
                    var newTargetInventory = new CurrentInventory
                    {
                        ProductId = item.ProductId.Value,
                        LocationId = order.ToLocationId.Value,
                        LotId = item.LotId,
                        Quantity = qty,
                        ReservedQuantity = 0
                    };
                    await _unitOfWork.CurrentInventory.AddAsync(newTargetInventory);
                }
            }
        }

        order.Status = Done;
        order.CompletedAt = now;
        await _unitOfWork.ScrapOrder.UpdateAsync(order);

        docDetail.Status = Done;
        docDetail.CompletedAt = now;
        foreach (var t in docDetail.StockTransactions)
        {
            t.Status = Done;
            t.ActualQty = t.PlannedQty;
            t.CompletedAt = now;
            await _unitOfWork.StockTransaction.UpdateAsync(t);
        }
        await _unitOfWork.StockDocument.UpdateAsync(docDetail);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapDetail(order, stockDoc.Id);
    }

    public async Task<ScrapOrderDetailDto> CancelAsync(int managerId, int id, CancellationToken cancellationToken = default)
    {
        if (managerId <= 0) throw new BadRequestException("ManagerId is required from context.");

        var order = await GetOrderWithItemsOrThrow(id, cancellationToken);
        if (order.Status == Done)
            throw new BadRequestException("Completed scrap order cannot be cancelled.");
        if (order.Status == Cancelled)
            throw new BadRequestException("Scrap order is already cancelled.");

        await EnsureManagerAccessAsync(order.WarehouseId, order.LocationId, managerId);

        order.Status = Cancelled;
        order.CompletedAt = DateTime.UtcNow;
        await _unitOfWork.ScrapOrder.UpdateAsync(order);

        var stockDoc = await FindLinkedStockDocument(id, cancellationToken);
        if (stockDoc != null)
        {
            var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
            if (docDetail != null)
            {
                var now = DateTime.UtcNow;
                docDetail.Status = Cancelled;
                docDetail.CompletedAt = now;
                foreach (var t in docDetail.StockTransactions)
                {
                    t.Status = Cancelled;
                    t.CompletedAt = now;
                    await _unitOfWork.StockTransaction.UpdateAsync(t);
                }
                await _unitOfWork.StockDocument.UpdateAsync(docDetail);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapDetail(order, stockDoc?.Id);
    }

    public async Task<ScrapOrderDetailDto> UpdateAsync(int managerId, int id, CreateScrapOrderDto dto, CancellationToken cancellationToken = default)
    {
        if (managerId <= 0) throw new BadRequestException("ManagerId is required from context.");
        if (dto.WarehouseId <= 0) throw new BadRequestException("WarehouseId is required.");
        if (dto.LocationId <= 0) throw new BadRequestException("LocationId is required.");
        if (dto.Item == null) throw new BadRequestException("Scrap order item is required.");

        var order = await GetOrderWithItemsOrThrow(id, cancellationToken);
        if (order.Status != Draft)
            throw new BadRequestException("Can only update scrap order from Draft status.");

        await EnsureManagerAccessAsync(dto.WarehouseId, dto.LocationId, managerId);
        
        await ValidateProduct(dto.Item.ProductId);
        if (dto.Item.Quantity <= 0) throw new BadRequestException("Quantity must be greater than 0.");
        if (dto.Item.UomId <= 0) throw new BadRequestException("UomId is required.");
        if (dto.Item.LotId <= 0) throw new BadRequestException("LotId is required.");

        var scrapLocationId = await GetVirtualScrapLocationIdAsync();

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await ValidateLot(dto.Item.LotId);

            // 1. Cập nhật ScrapOrder
            order.WarehouseId = dto.WarehouseId;
            order.LocationId = dto.LocationId;
            order.ToLocationId = scrapLocationId;

            // 2. Cập nhật ScrapOrderItem
            var item = order.ScrapOrderItems.FirstOrDefault();
            if (item != null)
            {
                item.ProductId = dto.Item.ProductId;
                item.Quantity = dto.Item.Quantity;
                item.UomId = dto.Item.UomId;
                item.LotId = dto.Item.LotId;
                item.Reason = dto.Item.Reason;
            }
            else
            {
                order.ScrapOrderItems.Add(new ScrapOrderItem
                {
                    ScrapOrderId = order.Id,
                    ProductId = dto.Item.ProductId,
                    Quantity = dto.Item.Quantity,
                    UomId = dto.Item.UomId,
                    LotId = dto.Item.LotId,
                    Reason = dto.Item.Reason
                });
            }

            await _unitOfWork.ScrapOrder.UpdateAsync(order);

            // 3. Cập nhật StockDocument liên kết
            var stockDoc = await FindLinkedStockDocument(id, cancellationToken);
            if (stockDoc != null)
            {
                stockDoc.FromLocationId = dto.LocationId;
                stockDoc.ToLocationId = scrapLocationId;
                await _unitOfWork.StockDocument.UpdateAsync(stockDoc);

                // 4. Cập nhật StockTransactions
                var transactions = (await _unitOfWork.StockTransaction.GetByDocumentIdAsync(stockDoc.Id)).ToList();
                var transaction = transactions.FirstOrDefault();
                if (transaction != null)
                {
                    transaction.ProductId = dto.Item.ProductId;
                    transaction.UomId = dto.Item.UomId;
                    transaction.FromLocationId = dto.LocationId;
                    transaction.ToLocationId = scrapLocationId;
                    transaction.LotId = dto.Item.LotId;
                    transaction.PlannedQty = dto.Item.Quantity;
                    await _unitOfWork.StockTransaction.UpdateAsync(transaction);
                    
                    // Xóa các transaction thừa nếu có (do logic cũ hỗ trợ nhiều items)
                    foreach (var extra in transactions.Skip(1))
                    {
                        await _unitOfWork.StockTransaction.DeleteAsync(extra);
                    }
                }
                else
                {
                    // Tạo mới nếu chưa có
                    var newTransaction = new StockTransaction
                    {
                        DocumentId = stockDoc.Id,
                        ProductId = dto.Item.ProductId,
                        UomId = dto.Item.UomId,
                        FromLocationId = dto.LocationId,
                        ToLocationId = scrapLocationId,
                        LotId = dto.Item.LotId,
                        PlannedQty = dto.Item.Quantity,
                        ActualQty = 0,
                        ReservedQty = 0,
                        TransactionType = "scrap_order",
                        Status = StockPending,
                        CreatedAt = DateTime.UtcNow,
                        PlannedDate = DateTime.UtcNow.Date
                    };
                    await _unitOfWork.StockTransaction.AddAsync(newTransaction);
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return MapDetail(order, stockDoc?.Id);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task DeleteAsync(int managerId, int id, CancellationToken cancellationToken = default)
    {
        if (managerId <= 0) throw new BadRequestException("ManagerId is required from context.");

        var order = await GetOrderWithItemsOrThrow(id, cancellationToken);
        if (order.Status != Draft)
            throw new BadRequestException($"Cannot delete scrap order in {order.Status} status. Only Draft is allowed.");

        await EnsureManagerAccessAsync(order.WarehouseId, order.LocationId, managerId);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // 1. Tìm và xóa StockDocument + Transactions
            var stockDoc = await FindLinkedStockDocument(id, cancellationToken);
            if (stockDoc != null)
            {
                var transactions = (await _unitOfWork.StockTransaction.GetByDocumentIdAsync(stockDoc.Id)).ToList();
                foreach (var t in transactions)
                {
                    await _unitOfWork.StockTransaction.DeleteAsync(t);
                }
                await _unitOfWork.StockDocument.DeleteAsync(stockDoc);
            }

            // 2. Xóa ScrapOrder và các Items (ScrapOrderItems)
            // Lấy lại order với items đầy đủ để repo xóa cho chắc chắn
            var orderWithItems = await _unitOfWork.ScrapOrder.GetByIdWithItemsAsync(id, cancellationToken);
            if (orderWithItems != null)
            {
                await _unitOfWork.ScrapOrder.DeleteAsync(orderWithItems);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    private async Task<string> GenerateScrapNoAsync(CancellationToken cancellationToken)
    {
        const string prefix = "SCR";
        var year = DateTime.UtcNow.Year;

        var all = await _unitOfWork.ScrapOrder.GetAllAsync(cancellationToken);

        var count = all.Count(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Year == year);

        return $"{prefix}-{year}-{count + 1:D3}";
    }

    private async Task<ScrapOrder> GetOrderWithItemsOrThrow(int id, CancellationToken cancellationToken)
    {
        if (id <= 0) throw new BadRequestException("Id is invalid.");
        var order = await _unitOfWork.ScrapOrder.GetByIdWithItemsAsync(id, cancellationToken);
        if (order == null) throw new NotFoundException("Scrap order not found.");
        return order;
    }

    private async Task ValidateProduct(int productId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId);
        if (product == null) throw new NotFoundException($"Product {productId} not found.");
    }

    private async Task ValidateLot(int lotId)
    {
        var lot = await _unitOfWork.ProductLot.GetByIdAsync(lotId);
        if (lot == null) throw new BadRequestException($"Lot {lotId} not found.");
    }

    private async Task EnsureManagerAccessAsync(int warehouseId, int locationId, int managerId)
    {
        var managerWarehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(managerId)).ToList();
        var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();
        if (!managerWarehouseIds.Any())
            throw new BadRequestException("No warehouses found for this manager.");

        if (!managerWarehouseIds.Contains(warehouseId))
            throw new BadRequestException("Warehouse must belong to one of the warehouses managed by the staff's manager.");

        var location = await _unitOfWork.Location.GetByIdAsync(locationId);
        if (location == null) throw new NotFoundException("Location not found.");
        if (!location.WarehouseId.HasValue || !managerWarehouseIds.Contains(location.WarehouseId.Value))
            throw new BadRequestException("Location must belong to one of the warehouses managed by the staff's manager.");
    }

    private async Task<StockDocument?> FindLinkedStockDocument(int orderId, CancellationToken cancellationToken)
    {
        var allDocs = await _unitOfWork.StockDocument.GetAllAsync();
        return allDocs.FirstOrDefault(d => d.ReferenceType == "scrap_order" && d.ReferenceId == orderId);
    }

    private static ScrapOrderDetailDto MapDetail(ScrapOrder order, int? stockDocumentId)
    {
        return new ScrapOrderDetailDto
        {
            Id = order.Id,
            ScrapNo = order.ScrapNo,
            WarehouseId = order.WarehouseId,
            WarehouseName = order.Warehouse?.Name,
            LocationId = order.LocationId,
            LocationName = order.Location?.Name,
            ToLocationId = order.ToLocationId,
            ToLocationName = order.ToLocation?.Name,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            ConfirmedAt = order.ConfirmedAt,
            CompletedAt = order.CompletedAt,
            CreatedById = order.CreatedById,
            CreatedByName = order.CreatedByName,
            StockDocumentId = stockDocumentId,
            Items = order.ScrapOrderItems?.Select(i => new ScrapOrderItemDto
            {
                Id = i.Id,
                ScrapOrderId = i.ScrapOrderId,
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UomId = i.UomId,
                LotId = i.LotId,
                Reason = i.Reason
            }).ToList() ?? new List<ScrapOrderItemDto>()
        };
    }

    private static ScrapOrderListItemDto MapListItem(ScrapOrder order)
    {
        return new ScrapOrderListItemDto
        {
            Id = order.Id,
            ScrapNo = order.ScrapNo,
            WarehouseId = order.WarehouseId,
            WarehouseName = order.Warehouse?.Name,
            LocationId = order.LocationId,
            LocationName = order.Location?.Name,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            ConfirmedAt = order.ConfirmedAt,
            CompletedAt = order.CompletedAt,
            CreatedByName = order.CreatedByName
        };
    }

    private async Task<int?> GetVirtualScrapLocationIdAsync()
    {
        var scrapWarehouse = await _unitOfWork.Warehouse.GetByCodeWithLocationsAsync(ScrapWarehouseCode);

        if (scrapWarehouse == null) return null;

        var scrapLocation = scrapWarehouse.Locations.FirstOrDefault(l => l.Type?.ToLower() == "scrap");
        return scrapLocation?.Id;
    }
}
