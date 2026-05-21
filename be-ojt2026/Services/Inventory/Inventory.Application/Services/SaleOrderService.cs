using System;
using BuildingBlocks.Exceptions;
using BuildingBlocks.Utils;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using StackExchange.Redis;

namespace Inventory.Application.Services
{
    public class SaleOrderService : ISaleOrderService
    {
        private static readonly string Draft = SaleOrderStatus.Draft.ToString().ToLowerInvariant();
        private static readonly string Waiting = SaleOrderStatus.Waiting.ToString().ToLowerInvariant();
        private static readonly string Ready = SaleOrderStatus.Ready.ToString().ToLowerInvariant();
        private static readonly string Done = SaleOrderStatus.Done.ToString().ToLowerInvariant();
        private static readonly string Cancelled = SaleOrderStatus.Cancelled.ToString().ToLowerInvariant();
        private static readonly string StockPending = StockDocumentStatus.Pending.ToString().ToLowerInvariant();

        private readonly IUnitOfWork _unitOfWork;

        public SaleOrderService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ===== QUERY =====

        public async Task<PagedResultDto<SaleOrderListItemDto>> GetAllAsync(
            int? managerId,
            int? userId,
            string? status,
            string? orderNo,
            string? locationName,
            string? createdBy,
            int? createdById,
            DateTime? fromDate, DateTime? toDate,
            DateTime? fromPlannedDate, DateTime? toPlannedDate,
            int page,
            int pageSize)
        {
            if (page <= 0) throw new BadRequestException("page must be greater than 0.");
            if (pageSize <= 0) throw new BadRequestException("pageSize must be greater than 0.");

            var all = await _unitOfWork.SaleOrder.GetAllAsync();
            var list = all;

            int? effectiveManagerId = managerId;
            if (!effectiveManagerId.HasValue && userId.HasValue)
                effectiveManagerId = userId;

            if (effectiveManagerId.HasValue)
            {
                var managerWarehouses = await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId.Value);
                var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();

                var saleOrderStockDocs = (await _unitOfWork.StockDocument.GetAllWithLocationsAsync())
                    .Where(sd => sd.ReferenceType == "SaleOrder" && sd.ReferenceId.HasValue)
                    .ToList();

                var allowedOrderIds = saleOrderStockDocs
                    .Where(sd => sd.FromLocation?.WarehouseId.HasValue == true
                              && managerWarehouseIds.Contains(sd.FromLocation.WarehouseId.Value))
                    .Select(sd => sd.ReferenceId!.Value)
                    .ToHashSet();

                list = list.Where(x => allowedOrderIds.Contains(x.Id));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalized = status.Trim().ToLowerInvariant();
                list = list.Where(x => x.Status == normalized);
            }

            if (!string.IsNullOrWhiteSpace(orderNo))
            {
                list = list.Where(x => TextNormalizer.ContainsNormalized(x.OrderNo, orderNo));
            }

            if (!string.IsNullOrWhiteSpace(locationName))
            {
                // Fetch all StockDocuments with FromLocation to search by source location name
                var saleOrderStockDocs = (await _unitOfWork.StockDocument.GetAllWithLocationsAsync())
                    .Where(sd => sd.ReferenceType == StockDocumentReferenceType.SaleOrder.ToString() && sd.ReferenceId.HasValue)
                    .GroupBy(sd => sd.ReferenceId!.Value)
                    .ToDictionary(g => g.Key, g => g.First());

                var term = TextNormalizer.NormalizeForSearch(locationName);
                list = list.Where(x =>
                    (TextNormalizer.ContainsNormalized(x.Customer?.CustomerName, locationName)) ||
                    (TextNormalizer.ContainsNormalized(x.Customer?.Address, locationName)) ||
                    (saleOrderStockDocs.TryGetValue(x.Id, out var sd) && TextNormalizer.ContainsNormalized(sd.FromLocation?.Name, locationName))
                );
            }

            if (!string.IsNullOrWhiteSpace(createdBy))
            {
                list = list.Where(x => TextNormalizer.ContainsNormalized(x.CreatedByName, createdBy));
            }

            if (createdById.HasValue)
            {
                list = list.Where(x => x.CreatedById == createdById.Value);
            }

            if (fromDate.HasValue)
                list = list.Where(x => x.CreatedAt >= fromDate.Value.Date);
            if (toDate.HasValue)
            //list = list.Where(x => x.CreatedAt <= toDate);
            {
                // Chỉnh toDate lên cuối ngày để không sót đơn hàng trong ngày đó
                var endOfToDate = toDate.Value.Date.AddDays(1).AddTicks(-1);
                list = list.Where(x => x.CreatedAt <= endOfToDate);
            }
            if (fromPlannedDate.HasValue || toPlannedDate.HasValue)
            {
                var allStockDocs = await _unitOfWork.StockDocument.GetAllWithLocationsAsync();

                var saleOrderIdsWithPlannedDate = allStockDocs
                    .Where(sd => sd.ReferenceType == StockDocumentReferenceType.SaleOrder.ToString())
                    .Where(sd =>
                        sd.StockTransactions.Any(tx =>
                            (!fromPlannedDate.HasValue || tx.PlannedDate >= fromPlannedDate.Value) &&
                            (!toPlannedDate.HasValue || tx.PlannedDate <= toPlannedDate.Value)
                        )
                    )
                    .Select(sd => sd.ReferenceId ?? 0);

                list = list.Where(x => saleOrderIdsWithPlannedDate.Contains(x.Id));
            }

            var filtered = list.ToList();
            var totalItems = filtered.Count;
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

            var items = new List<SaleOrderListItemDto>();
            foreach (var order in filtered.Skip((page - 1) * pageSize).Take(pageSize))
            {
                var stockDoc = await FindLinkedStockDocument(order.Id);
                items.Add(MapListItem(order, stockDoc));
            }

            return new PagedResultDto<SaleOrderListItemDto>
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

        public async Task<SaleOrderDetailDto> GetByIdAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            var stockDoc = await FindLinkedStockDocument(id);
            return MapDetail(order, stockDoc);
        }

        public async Task<SaleOrderStatusCountDto> GetStatusCountAsync()
        {
            return new SaleOrderStatusCountDto
            {
                Draft = await _unitOfWork.SaleOrder.CountByStatusAsync(Draft),
                Waiting = await _unitOfWork.SaleOrder.CountByStatusAsync(Waiting),
                Ready = await _unitOfWork.SaleOrder.CountByStatusAsync(Ready),
                Done = await _unitOfWork.SaleOrder.CountByStatusAsync(Done),
                Cancelled = await _unitOfWork.SaleOrder.CountByStatusAsync(Cancelled)
            };
        }

        // ===== CREATE =====

        public async Task<SaleOrderDetailDto> CreateAsync(int? managerId, int userId, string? userName, CreateSaleOrderDto dto)
        {
            if (dto.CustomerId <= 0) throw new BadRequestException("CustomerId is required.");
            if (!dto.LocationId.HasValue || dto.LocationId.Value <= 0)
                throw new BadRequestException("FromLocationId is required.");

            var now = DateTime.UtcNow;
            if (dto.PlannedDate == default || dto.PlannedDate.Date < now.Date)
                throw new BadRequestException("PlannedDate must be provided and cannot be in the past.");

            if (!dto.ToLocationId.HasValue || dto.ToLocationId.Value <= 0)
                throw new BadRequestException("ToLocationId is required.");

            // 1. Xác định ManagerId hiệu dụng (nếu claim ManagerId null thì dùng UserId)
            int effectiveManagerId = managerId ?? userId;

            // 2. Lấy danh sách kho cùng manager
            var managerWarehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId)).ToList();
            var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();

            if (!managerWarehouseIds.Any())
                throw new BadRequestException("No warehouses found for this manager/user.");

            // 3. Validate LocationId phải thuộc kho cùng manager
            var location = await _unitOfWork.Location.GetByIdAsync(dto.LocationId.Value);
            if (location == null) throw new NotFoundException("Location not found.");
            if (!location.WarehouseId.HasValue || !managerWarehouseIds.Contains(location.WarehouseId.Value))
                throw new BadRequestException("Location must belong to one of the warehouses managed by the staff's manager.");

            if (dto.ToLocationId.Value != dto.CustomerId)
                throw new BadRequestException("ToLocationId must match CustomerId.");

            var customer = await _unitOfWork.Customer.GetCustomerByIdAsync(dto.CustomerId);
            if (customer == null) throw new NotFoundException("Customer not found.");

            var toCustomer = await _unitOfWork.Customer.GetCustomerByIdAsync(dto.ToLocationId.Value);
            if (toCustomer == null) throw new NotFoundException("Customer not found.");

            var orderNo = await GenerateOrderNoAsync();

            var productIds = new HashSet<int>();
            foreach (var itemDto in dto.Items)
            {
                if (!productIds.Add(itemDto.ProductId))
                    throw new BadRequestException($"Product {itemDto.ProductId} already exists in sale order.");

                await ValidateProduct(itemDto.ProductId);
                if (itemDto.OrderedQty <= 0) throw new BadRequestException("OrderedQty must be greater than 0.");
                if (itemDto.UnitPrice < 0) throw new BadRequestException("UnitPrice must not be negative.");
            }

            var order = new SaleOrder
            {
                OrderNo = orderNo,
                CustomerId = dto.CustomerId,
                Status = Draft,
                TotalAmount = 0,
                CreatedAt = now,
                CreatedById = userId,
                CreatedByName = userName,
                Note = dto.Note
            };

            await _unitOfWork.SaleOrder.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            decimal totalAmount = 0;
            foreach (var itemDto in dto.Items)
            {
                var subtotal = itemDto.OrderedQty * itemDto.UnitPrice;
                var item = new SaleOrderItem
                {
                    SaleOrderId = order.Id,
                    ProductId = itemDto.ProductId,
                    OrderedQty = itemDto.OrderedQty,
                    ShippedQty = 0,
                    UnitPrice = itemDto.UnitPrice,
                    Subtotal = subtotal
                };
                totalAmount += subtotal;
                await _unitOfWork.SaleOrderItem.AddAsync(item);
            }

            order.TotalAmount = totalAmount;
            await _unitOfWork.SaleOrder.UpdateAsync(order);

            // Tạo StockDocument liên kết
            var stockDoc = new StockDocument
            {
                DocumentNo = orderNo,
                DocumentType = StockDocumentType.SaleOrder.ToString(),
                ReferenceType = StockDocumentReferenceType.SaleOrder.ToString(),
                ReferenceId = order.Id,
                Origin = $"Sale Order {orderNo}",
                FromLocationId = dto.LocationId,
                ToLocationId = dto.ToLocationId,
                Status = StockPending,
                CreatedAt = now
            };
            await _unitOfWork.StockDocument.AddAsync(stockDoc);
            await _unitOfWork.SaveChangesAsync();

            // Tạo StockTransactions cho từng item
            var createdOrder = await GetOrderWithItemsOrThrow(order.Id);
            foreach (var item in createdOrder.SaleOrderItems)
            {
                var product = await _unitOfWork.Product.GetByIdAsync(item.ProductId);
                var selectedLot = await SelectLotForTransaction(item.ProductId, dto.LocationId ?? 0);
                var transaction = new StockTransaction
                {
                    DocumentId = stockDoc.Id,
                    ProductId = item.ProductId,
                    UomId = product?.BaseUomId,
                    FromLocationId = dto.LocationId,
                    ToLocationId = dto.ToLocationId,
                    LotId = selectedLot?.Id,
                    PlannedQty = item.OrderedQty,
                    ActualQty = 0,
                    ReservedQty = 0,
                    TransactionType = StockTransactionType.SaleOrder.ToString(),
                    Status = StockPending,
                    CreatedAt = now,
                    PlannedDate = dto.PlannedDate.Date
                };
                await _unitOfWork.StockTransaction.AddAsync(transaction);
            }
            await _unitOfWork.SaveChangesAsync();

            return MapDetail(createdOrder, stockDoc);
        }

        // ===== UPDATE HEADER =====

        public async Task<SaleOrderDetailDto> UpdateAsync(int? managerId, int userId, int id, UpdateSaleOrderDto dto)
        {
            var order = await GetOrderOrThrow(id);
            EnsureDraft(order.Status);

            // 1. Xác định ManagerId hiệu dụng
            int effectiveManagerId = managerId ?? userId;

            // 2. Lấy danh sách kho cùng manager
            var managerWarehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId)).ToList();
            var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();

            if (!managerWarehouseIds.Any())
                throw new BadRequestException("No warehouses found for this manager/user.");

            if (dto.CustomerId.HasValue && dto.CustomerId.Value > 0)
            {
                var customer = await _unitOfWork.Customer.GetCustomerByIdAsync(dto.CustomerId.Value);
                if (customer == null) throw new NotFoundException("Customer not found.");
                order.CustomerId = dto.CustomerId.Value;

                if (!dto.ToLocationId.HasValue)
                    dto.ToLocationId = dto.CustomerId.Value;
            }

            if (dto.ToLocationId.HasValue && dto.ToLocationId.Value > 0)
            {
                var toCustomer = await _unitOfWork.Customer.GetCustomerByIdAsync(dto.ToLocationId.Value);
                if (toCustomer == null) throw new NotFoundException("Customer not found.");

                if (!dto.CustomerId.HasValue)
                    dto.CustomerId = dto.ToLocationId.Value;

                order.CustomerId = dto.ToLocationId.Value;
            }
            else if (dto.ToLocationId.HasValue)
            {
                throw new BadRequestException("ToLocationId is required.");
            }

            if (dto.CustomerId != dto.ToLocationId)
                throw new BadRequestException("ToLocationId must match CustomerId.");

            order.Note = dto.Note;
            var stockDoc = await FindLinkedStockDocument(id);

            if (stockDoc != null)
            {
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docDetail != null)
                {
                    if (dto.LocationId.HasValue)
                    {
                        // Validate LocationId phải thuộc kho cùng manager
                        var location = await _unitOfWork.Location.GetByIdAsync(dto.LocationId.Value);
                        if (location == null) throw new NotFoundException("Location not found.");
                        if (!location.WarehouseId.HasValue || !managerWarehouseIds.Contains(location.WarehouseId.Value))
                            throw new BadRequestException("Location must belong to one of the warehouses managed by the staff's manager.");

                        docDetail.FromLocationId = dto.LocationId;
                        foreach (var t in docDetail.StockTransactions)
                        {
                            t.FromLocationId = dto.LocationId;
                            await _unitOfWork.StockTransaction.UpdateAsync(t);
                        }
                    }

                    if (dto.ToLocationId.HasValue)
                    {
                        docDetail.ToLocationId = dto.ToLocationId;
                        foreach (var t in docDetail.StockTransactions)
                        {
                            t.ToLocationId = dto.ToLocationId;
                            await _unitOfWork.StockTransaction.UpdateAsync(t);
                        }
                    }

                    if (dto.PlannedDate.HasValue)
                    {
                        foreach (var t in docDetail.StockTransactions)
                        {
                            t.PlannedDate = dto.PlannedDate.Value.Date;
                            await _unitOfWork.StockTransaction.UpdateAsync(t);
                        }
                    }

                    await _unitOfWork.StockDocument.UpdateAsync(docDetail);
                }
            }

            await _unitOfWork.SaleOrder.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(id);
            return MapDetail(updated, stockDoc);
        }

        // ===== DELETE =====

        public async Task DeleteAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            EnsureDraft(order.Status);

            // Xóa StockTransactions + StockDocument liên kết
            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc != null)
            {
                var docWithDetails = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docWithDetails != null)
                {
                    foreach (var t in docWithDetails.StockTransactions.ToList())
                        await _unitOfWork.StockTransaction.DeleteAsync(t);
                    await _unitOfWork.StockDocument.DeleteAsync(docWithDetails);
                }
            }

            foreach (var item in order.SaleOrderItems.ToList())
                await _unitOfWork.SaleOrderItem.DeleteAsync(item);

            await _unitOfWork.SaleOrder.DeleteAsync(order);
            await _unitOfWork.SaveChangesAsync();
        }

        // ===== CRUD ITEMS =====

        public async Task<SaleOrderDetailDto> AddItemAsync(int orderId, SaleOrderItemUpsertDto dto)
        {
            var order = await GetOrderOrThrow(orderId);
            EnsureDraft(order.Status);
            await ValidateProduct(dto.ProductId);
            if (dto.OrderedQty <= 0) throw new BadRequestException("OrderedQty must be greater than 0.");
            if (dto.UnitPrice < 0) throw new BadRequestException("UnitPrice must not be negative.");

            var existingItems = await _unitOfWork.SaleOrderItem.GetBySaleOrderIdAsync(orderId);
            if (existingItems.Any(i => i.ProductId == dto.ProductId))
                throw new BadRequestException($"Product {dto.ProductId} already exists in sale order.");

            var subtotal = dto.OrderedQty * dto.UnitPrice;
            var item = new SaleOrderItem
            {
                SaleOrderId = orderId,
                ProductId = dto.ProductId,
                OrderedQty = dto.OrderedQty,
                ShippedQty = 0,
                UnitPrice = dto.UnitPrice,
                Subtotal = subtotal
            };
            await _unitOfWork.SaleOrderItem.AddAsync(item);

            // Sync: thêm StockTransaction tương ứng
            var stockDoc = await FindLinkedStockDocument(orderId);
            if (stockDoc != null)
            {
                var product = await _unitOfWork.Product.GetByIdAsync(dto.ProductId);
                var selectedLot = await SelectLotForTransaction(dto.ProductId, stockDoc.FromLocationId ?? 0);
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                var existingTx = docDetail?.StockTransactions.FirstOrDefault();
                var transaction = new StockTransaction
                {
                    DocumentId = stockDoc.Id,
                    ProductId = dto.ProductId,
                    UomId = product?.BaseUomId,
                    FromLocationId = stockDoc.FromLocationId,
                    ToLocationId = stockDoc.ToLocationId,
                    LotId = selectedLot?.Id,
                    PlannedQty = dto.OrderedQty,
                    ActualQty = 0,
                    ReservedQty = 0,
                    TransactionType = StockTransactionType.SaleOrder.ToString(),
                    Status = stockDoc.Status,
                    CreatedAt = DateTime.UtcNow,
                    PlannedDate = existingTx?.PlannedDate ?? DateTime.UtcNow.Date
                };
                await _unitOfWork.StockTransaction.AddAsync(transaction);
            }

            await RecalculateTotal(orderId);
            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(orderId);
            return MapDetail(updated, stockDoc);
        }

        private async Task<ProductLot?> SelectLotForTransaction(int productId, int fromLocationId)
        {
            if (fromLocationId <= 0) return null;

            var inventories = await _unitOfWork.CurrentInventory.GetAvailableByProductLocationAsync(
                productId, fromLocationId);

            if (!inventories.Any()) return null;

            var selectedInventory = inventories
                .OrderBy(x => x.Lot?.ExpirationDate ?? DateTime.MaxValue)
                .ThenBy(x => x.LotId)
                .ThenByDescending(x => (x.Quantity ?? 0) - (x.ReservedQuantity ?? 0))
                .FirstOrDefault();

            return selectedInventory?.Lot;
        }

        public async Task<SaleOrderDetailDto> UpdateItemAsync(int orderId, int itemId, SaleOrderItemUpsertDto dto)
        {
            var order = await GetOrderOrThrow(orderId);
            EnsureDraft(order.Status);

            var item = await _unitOfWork.SaleOrderItem.GetByIdAsync(itemId);
            if (item == null || item.SaleOrderId != orderId)
                throw new NotFoundException("Sale order item not found.");

            var existingItems = await _unitOfWork.SaleOrderItem.GetBySaleOrderIdAsync(orderId);
            if (existingItems.Any(i => i.Id != itemId && i.ProductId == dto.ProductId))
                throw new BadRequestException($"Product {dto.ProductId} already exists in sale order.");

            await ValidateProduct(dto.ProductId);
            if (dto.OrderedQty <= 0) throw new BadRequestException("OrderedQty must be greater than 0.");
            if (dto.UnitPrice < 0) throw new BadRequestException("UnitPrice must not be negative.");

            // Cập nhật StockTransaction tương ứng
            var stockDoc = await FindLinkedStockDocument(orderId);
            if (stockDoc != null)
            {
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docDetail != null)
                {
                    var matchingTx = docDetail.StockTransactions
                        .FirstOrDefault(t => t.ProductId == item.ProductId);
                    if (matchingTx != null)
                    {
                        var product = await _unitOfWork.Product.GetByIdAsync(dto.ProductId);
                        var selectedLot = await SelectLotForTransaction(dto.ProductId, docDetail.FromLocationId ?? 0);
                        matchingTx.ProductId = dto.ProductId;
                        matchingTx.UomId = product?.BaseUomId;
                        matchingTx.PlannedQty = dto.OrderedQty;
                        matchingTx.ToLocationId = docDetail.ToLocationId;
                        matchingTx.LotId = selectedLot?.Id;
                        await _unitOfWork.StockTransaction.UpdateAsync(matchingTx);
                    }
                }
            }

            item.ProductId = dto.ProductId;
            item.OrderedQty = dto.OrderedQty;
            item.UnitPrice = dto.UnitPrice;
            item.Subtotal = dto.OrderedQty * dto.UnitPrice;
            await _unitOfWork.SaleOrderItem.UpdateAsync(item);

            await RecalculateTotal(orderId);
            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(orderId);
            return MapDetail(updated, stockDoc);
        }

        public async Task<SaleOrderDetailDto> DeleteItemAsync(int orderId, int itemId)
        {
            var order = await GetOrderOrThrow(orderId);
            EnsureDraft(order.Status);

            var item = await _unitOfWork.SaleOrderItem.GetByIdAsync(itemId);
            if (item == null || item.SaleOrderId != orderId)
                throw new NotFoundException("Sale order item not found.");

            // Xóa StockTransaction tương ứng
            var stockDoc = await FindLinkedStockDocument(orderId);
            if (stockDoc != null)
            {
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docDetail != null)
                {
                    var matchingTx = docDetail.StockTransactions
                        .FirstOrDefault(t => t.ProductId == item.ProductId);
                    if (matchingTx != null)
                        await _unitOfWork.StockTransaction.DeleteAsync(matchingTx);
                }
            }

            await _unitOfWork.SaleOrderItem.DeleteAsync(item);
            await RecalculateTotal(orderId);
            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(orderId);
            return MapDetail(updated, stockDoc);
        }

        // ===== STATUS WORKFLOW =====

        public async Task<SaleOrderDetailDto> CheckAvailabilityAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            if (order.Status != Draft && order.Status != Waiting)
                throw new BadRequestException("Can only check availability from Draft or Waiting status.");

            if (!order.SaleOrderItems.Any())
                throw new BadRequestException("Sale order must have at least one item.");

            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc == null)
                throw new BadRequestException("Linked stock document not found.");

            var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
            if (docDetail == null)
                throw new BadRequestException("Stock document details not found.");

            if (!docDetail.FromLocationId.HasValue)
                throw new BadRequestException("From location is required before checking availability.");

            if (!docDetail.ToLocationId.HasValue)
                throw new BadRequestException("To location is required before checking availability.");

            // Check inventory availability
            bool isEnoughStock = true;
            var now = DateTime.UtcNow;
            foreach (var item in order.SaleOrderItems)
            {
                var fromLocationId = docDetail.FromLocationId;
                if (!fromLocationId.HasValue)
                {
                    isEnoughStock = false;
                    break;
                }

                var inventories = await _unitOfWork.CurrentInventory.GetAvailableByProductLocationAsync(
                    item.ProductId, fromLocationId.Value);
                var available = inventories.Sum(x => (x.Quantity ?? 0) - (x.ReservedQuantity ?? 0));

                if (available < item.OrderedQty)
                {
                    isEnoughStock = false;
                    break;
                }
            }

            if (!isEnoughStock)
            {
                // Not enough stock -> go to (or stay in) waiting
                order.Status = Waiting;
            }
            else
            {
                // Enough stock -> go to ready + reserve inventory (split by lot)
                foreach (var item in order.SaleOrderItems)
                {
                    var inventories = await GetOrderedInventoriesForLotSplit(
                        item.ProductId, docDetail.FromLocationId!.Value);

                    var remaining = item.OrderedQty;
                    foreach (var inventory in inventories)
                    {
                        if (remaining <= 0) break;

                        var available = (inventory.Quantity ?? 0) - (inventory.ReservedQuantity ?? 0);
                        var take = Math.Min(available, remaining);
                        if (take <= 0) continue;

                        inventory.ReservedQuantity = (inventory.ReservedQuantity ?? 0) + take;
                        await _unitOfWork.CurrentInventory.UpdateAsync(inventory);
                        remaining -= take;
                    }

                    if (remaining > 0)
                        throw new BadRequestException($"Insufficient stock for product {item.ProductId} while reserving.");
                }

                order.Status = Ready;
                order.ConfirmedAt = now;
            }

            await _unitOfWork.SaleOrder.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            var result = await GetOrderWithItemsOrThrow(id);
            return MapDetail(result, stockDoc);
        }

        private async Task<List<CurrentInventory>> GetOrderedInventoriesForLotSplit(int productId, int fromLocationId)
        {
            var inventories = await _unitOfWork.CurrentInventory.GetAvailableByProductLocationAsync(
                productId, fromLocationId);

            return inventories
                .OrderBy(x => x.Lot?.ExpirationDate ?? DateTime.MaxValue)
                .ThenBy(x => x.LotId)
                .ThenByDescending(x => (x.Quantity ?? 0) - (x.ReservedQuantity ?? 0))
                .ToList();
        }

        private async Task<List<CurrentInventory>> GetOrderedReservedInventories(int productId, int fromLocationId)
        {
            var inventories = await _unitOfWork.CurrentInventory.GetReservedByProductLocationAsync(
                productId, fromLocationId);

            return inventories
                .OrderBy(x => x.Lot?.ExpirationDate ?? DateTime.MaxValue)
                .ThenBy(x => x.LotId)
                .ThenByDescending(x => x.ReservedQuantity ?? 0)
                .ToList();
        }

        private async Task<List<CurrentInventory>> GetOrderedInventoriesForCompletion(int productId, int fromLocationId)
        {
            var inventories = await _unitOfWork.CurrentInventory.GetAllByProductLocationAsync(
                productId, fromLocationId);

            return inventories
                .OrderBy(x => x.Lot?.ExpirationDate ?? DateTime.MaxValue)
                .ThenBy(x => x.LotId)
                .ThenByDescending(x => x.Quantity ?? 0)
                .ToList();
        }

        public async Task<SaleOrderDetailDto> MarkDoneAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            if (order.Status != Ready)
                throw new BadRequestException("Sale order must be ready before completing.");

            if (!order.SaleOrderItems.Any())
                throw new BadRequestException("Sale order must have at least one item.");

            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc == null)
                throw new BadRequestException("Linked stock document not found.");

            var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
            if (docDetail == null)
                throw new BadRequestException("Stock document details not found.");

            if (!docDetail.FromLocationId.HasValue)
                throw new BadRequestException("From location is required before completing.");

            if (!docDetail.ToLocationId.HasValue)
                throw new BadRequestException("To location is required before completing.");

            // Check available inventory trước khi trừ kho
            foreach (var item in order.SaleOrderItems)
            {
                var fromLocationId = docDetail.FromLocationId;
                if (!fromLocationId.HasValue)
                    throw new BadRequestException("Stock document has no from location set. Cannot check inventory.");

                var inventories = await _unitOfWork.CurrentInventory.GetAllByProductLocationAsync(
                    item.ProductId, fromLocationId.Value);
                var totalQty = inventories.Sum(x => x.Quantity ?? 0);

                if (totalQty < item.OrderedQty)
                    throw new BadRequestException("Tồn kho hiện tại không đủ.");
            }

            var now = DateTime.UtcNow;

            // Trừ tồn kho dự trữ khi chuyển sang done (nếu đã reserve trước đó)
            foreach (var item in order.SaleOrderItems)
            {
                var fromLocationId = docDetail.FromLocationId!.Value;
                var inventories = await GetOrderedReservedInventories(item.ProductId, fromLocationId);

                var remaining = item.OrderedQty;
                foreach (var inventory in inventories)
                {
                    if (remaining <= 0) break;

                    var reserved = inventory.ReservedQuantity ?? 0;
                    var take = Math.Min(reserved, remaining);
                    if (take <= 0) continue;

                    inventory.ReservedQuantity = reserved - take;
                    await _unitOfWork.CurrentInventory.UpdateAsync(inventory);
                    remaining -= take;
                }
            }

            // Trừ kho thực tế theo nhiều lot (FEFO/FIFO)
            foreach (var item in order.SaleOrderItems)
            {
                var fromLocationId = docDetail.FromLocationId!.Value;
                var inventories = await GetOrderedInventoriesForCompletion(item.ProductId, fromLocationId);

                var remaining = item.OrderedQty;
                foreach (var inventory in inventories)
                {
                    if (remaining <= 0) break;

                    var qty = inventory.Quantity ?? 0;
                    var take = Math.Min(qty, remaining);
                    if (take <= 0) continue;

                    inventory.Quantity = qty - take;
                    await _unitOfWork.CurrentInventory.UpdateAsync(inventory);
                    remaining -= take;
                }

                if (remaining > 0)
                    throw new BadRequestException("Tồn kho hiện tại không đủ.");

                item.ShippedQty = item.OrderedQty;
                await _unitOfWork.SaleOrderItem.UpdateAsync(item);
            }

            // Cập nhật trạng thái Order
            order.Status = Done;
            order.CompletedAt = now;
            await _unitOfWork.SaleOrder.UpdateAsync(order);

            // Cập nhật trạng thái StockDocument + Transactions
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

            await _unitOfWork.SaveChangesAsync();

            var result = await GetOrderWithItemsOrThrow(id);
            return MapDetail(result, stockDoc);
        }

        // ===== CANCEL (pending → cancelled) =====

        public async Task<SaleOrderDetailDto> CancelAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            if (order.Status == Done)
                throw new BadRequestException("Completed sale order cannot be cancelled.");
            if (order.Status == Cancelled)
                throw new BadRequestException("Sale order is already cancelled.");

            order.Status = Cancelled;
            order.CompletedAt = DateTime.UtcNow;
            await _unitOfWork.SaleOrder.UpdateAsync(order);

            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc != null)
            {
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docDetail != null)
                {
                    if (docDetail.FromLocationId.HasValue)
                    {
                        foreach (var item in order.SaleOrderItems)
                        {
                            var inventories = await GetOrderedReservedInventories(
                                item.ProductId, docDetail.FromLocationId.Value);

                            var remaining = item.OrderedQty;
                            foreach (var inventory in inventories)
                            {
                                if (remaining <= 0) break;

                                var reserved = inventory.ReservedQuantity ?? 0;
                                var take = Math.Min(reserved, remaining);
                                if (take <= 0) continue;

                                inventory.ReservedQuantity = reserved - take;
                                await _unitOfWork.CurrentInventory.UpdateAsync(inventory);
                                remaining -= take;
                            }
                        }
                    }

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

            await _unitOfWork.SaveChangesAsync();

            var result = await GetOrderWithItemsOrThrow(id);
            return MapDetail(result, stockDoc);
        }

        // ===== PRIVATE HELPERS =====

        private async Task<string> GenerateOrderNoAsync()
        {
            const string prefix = "SO";
            var year = DateTime.UtcNow.Year;

            var all = await _unitOfWork.SaleOrder.GetAllAsync();

            var count = all.Count(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Year == year);

            return $"{prefix}-{year}-{count + 1:D3}";
        }

        private async Task<SaleOrder> GetOrderOrThrow(int id)
        {
            if (id <= 0) throw new BadRequestException("Id is invalid.");
            var order = await _unitOfWork.SaleOrder.GetByIdAsync(id);
            if (order == null) throw new NotFoundException("Sale order not found.");
            return order;
        }

        private async Task<SaleOrder> GetOrderWithItemsOrThrow(int id)
        {
            if (id <= 0) throw new BadRequestException("Id is invalid.");
            var order = await _unitOfWork.SaleOrder.GetByIdWithItemsAsync(id);
            if (order == null) throw new NotFoundException("Sale order not found.");
            return order;
        }

        private async Task ValidateProduct(int productId)
        {
            var product = await _unitOfWork.Product.GetByIdAsync(productId);
            if (product == null) throw new NotFoundException($"Product {productId} not found.");
        }

        private static void EnsureDraft(string? status)
        {
            if (status != Draft)
                throw new BadRequestException("Operation only allowed when sale order is in draft status.");
        }

        private async Task RecalculateTotal(int orderId)
        {
            var order = await GetOrderWithItemsOrThrow(orderId);
            order.TotalAmount = order.SaleOrderItems.Sum(x => x.Subtotal);
            await _unitOfWork.SaleOrder.UpdateAsync(order);
        }

        private async Task<StockDocument?> FindLinkedStockDocument(int orderId)
        {
            return await _unitOfWork.StockDocument.GetByReferenceWithDetailsAsync(
                StockDocumentReferenceType.SaleOrder.ToString(), orderId);
        }

        // ===== MAPPING =====

        private static SaleOrderListItemDto MapListItem(SaleOrder o, StockDocument? stockDoc)
        {
            return new SaleOrderListItemDto
            {
                Id = o.Id,
                OrderNo = o.OrderNo,
                CustomerId = o.CustomerId,
                CustomerName = o.Customer?.CustomerName,
                FromLocationId = stockDoc?.FromLocationId,
                FromLocationName = stockDoc?.FromLocation?.Name,
                ToLocationId = stockDoc?.ToLocationId,
                ToLocationName = o.Customer?.Address,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                Note = o.Note,
                CreatedByName = o.CreatedByName,
                CreatedAt = o.CreatedAt,
                ConfirmedAt = o.ConfirmedAt,
                CompletedAt = o.CompletedAt
            };
        }

        private static SaleOrderDetailDto MapDetail(SaleOrder o, StockDocument? stockDoc)
        {
            return new SaleOrderDetailDto
            {
                Id = o.Id,
                OrderNo = o.OrderNo,
                CustomerId = o.CustomerId,
                CustomerName = o.Customer?.CustomerName,
                FromLocationId = stockDoc?.FromLocationId,
                FromLocationName = stockDoc?.FromLocation?.Name,
                ToLocationId = stockDoc?.ToLocationId,
                ToLocationName = o.Customer?.Address,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                Note = o.Note,
                CreatedByName = o.CreatedByName,
                CreatedAt = o.CreatedAt,
                ConfirmedAt = o.ConfirmedAt,
                CompletedAt = o.CompletedAt,
                StockDocumentId = stockDoc?.Id,
                PlannedDate = stockDoc?.StockTransactions?.FirstOrDefault()?.PlannedDate,
                Items = o.SaleOrderItems
                    .OrderBy(x => x.Id)
                    .Select(i => new SaleOrderItemDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product?.Name,
                        OrderedQty = i.OrderedQty,
                        ShippedQty = i.ShippedQty,
                        UnitPrice = i.UnitPrice,
                        Subtotal = i.Subtotal
                    })
                    .ToList()
            };
        }
    }
}
