using System;
using BuildingBlocks.Exceptions;
using BuildingBlocks.Utils;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class TransferOrderService : ITransferOrderService
    {
        private static readonly string Draft = TransferOrderStatus.Draft.ToString().ToLowerInvariant();
        private static readonly string Waiting = TransferOrderStatus.Waiting.ToString().ToLowerInvariant();
        private static readonly string Ready = TransferOrderStatus.Ready.ToString().ToLowerInvariant();
        private static readonly string Done = TransferOrderStatus.Done.ToString().ToLowerInvariant();
        private static readonly string Cancelled = TransferOrderStatus.Cancelled.ToString().ToLowerInvariant();
        private static readonly string StockPending = StockDocumentStatus.Pending.ToString().ToLowerInvariant();

        private readonly IUnitOfWork _unitOfWork;

        public TransferOrderService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ===== QUERY =====

        public async Task<PagedResultDto<TransferOrderListItemDto>> GetAllAsync(
            string? status,
            string? transferNo,
            string? locationName,
            string? createdBy,
            int? createdById,
            int page,
            int pageSize)
        {
            if (page <= 0) throw new BadRequestException("page must be greater than 0.");
            if (pageSize <= 0) throw new BadRequestException("pageSize must be greater than 0.");

            var all = await _unitOfWork.TransferOrder.GetAllAsync();
            var list = all;

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalized = status.Trim().ToLowerInvariant();
                list = list.Where(x => x.Status == normalized);
            }

            if (!string.IsNullOrWhiteSpace(transferNo))
            {
                list = list.Where(x => TextNormalizer.ContainsNormalized(x.TransferNo, transferNo));
            }

            if (!string.IsNullOrWhiteSpace(locationName))
            {
                list = list.Where(x =>
                    (TextNormalizer.ContainsNormalized(x.FromLocation?.Name, locationName)) ||
                    (TextNormalizer.ContainsNormalized(x.ToLocation?.Name, locationName))
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

            var filtered = list.ToList();
            var totalItems = filtered.Count;
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

            var pagedOrders = filtered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var items = new List<TransferOrderListItemDto>();
            foreach (var o in pagedOrders)
            {
                var plannedDate = await GetPlannedDateFromOrderAsync(o.Id);
                items.Add(MapListItem(o, plannedDate));
            }

            return new PagedResultDto<TransferOrderListItemDto>
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

        public async Task<TransferOrderDetailDto> GetByIdAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            var stockDoc = await FindLinkedStockDocument(id);
            var plannedDate = await GetPlannedDateFromOrderAsync(id);
            return MapDetail(order, stockDoc?.Id, plannedDate);
        }

        public async Task<TransferOrderStatusCountDto> GetStatusCountAsync()
        {
            return new TransferOrderStatusCountDto
            {
                Draft = await _unitOfWork.TransferOrder.CountByStatusAsync(Draft),
                Waiting = await _unitOfWork.TransferOrder.CountByStatusAsync(Waiting),
                Ready = await _unitOfWork.TransferOrder.CountByStatusAsync(Ready),
                Done = await _unitOfWork.TransferOrder.CountByStatusAsync(Done),
                Cancelled = await _unitOfWork.TransferOrder.CountByStatusAsync(Cancelled)
            };
        }

        // ===== CREATE =====

        public async Task<TransferOrderDetailDto> CreateAsync(int? managerId, int userId, string? userName, CreateTransferOrderDto dto)
        {
            if (dto.FromLocationId <= 0) throw new BadRequestException("FromLocationId is required.");
            if (dto.ToLocationId <= 0) throw new BadRequestException("ToLocationId is required.");
            if (dto.FromLocationId == dto.ToLocationId)
                throw new BadRequestException("FromLocation and ToLocation must be different.");

            var now = DateTime.UtcNow;
            if (dto.PlannedDate == default || dto.PlannedDate.Date < now.Date)
                throw new BadRequestException("PlannedDate must be provided and cannot be in the past.");

            // 1. Xác định ManagerId hiệu dụng
            int effectiveManagerId = managerId ?? userId;

            // 2. Lấy danh sách kho cùng manager
            var managerWarehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId)).ToList();
            var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();

            if (!managerWarehouseIds.Any())
                throw new BadRequestException("No warehouses found for this manager/user.");

            // 3. Validate FromLocation phải thuộc kho cùng manager
            var fromLoc = await _unitOfWork.Location.GetByIdAsync(dto.FromLocationId);
            if (fromLoc == null) throw new NotFoundException("From location not found.");
            if (!fromLoc.WarehouseId.HasValue || !managerWarehouseIds.Contains(fromLoc.WarehouseId.Value))
                throw new BadRequestException("From location must belong to one of the warehouses managed by the staff's manager.");

            // 4. Validate ToLocation phải thuộc kho cùng manager
            var toLoc = await _unitOfWork.Location.GetByIdAsync(dto.ToLocationId);
            if (toLoc == null) throw new NotFoundException("To location not found.");
            if (!toLoc.WarehouseId.HasValue || !managerWarehouseIds.Contains(toLoc.WarehouseId.Value))
                throw new BadRequestException("To location must belong to one of the warehouses managed by the staff's manager.");

            // Validate items BEFORE saving order to DB
            var productIds = new HashSet<int>();
            foreach (var itemDto in dto.Items)
            {
                if (!productIds.Add(itemDto.ProductId))
                    throw new BadRequestException($"Product {itemDto.ProductId} already exists in transfer order.");

                await ValidateProduct(itemDto.ProductId);
                if (itemDto.RequestedQty <= 0) throw new BadRequestException("RequestedQty must be greater than 0.");
            }

            var transferNo = await GenerateTransferNoAsync();

            var order = new TransferOrder
            {
                TransferNo = transferNo,
                FromLocationId = dto.FromLocationId,
                ToLocationId = dto.ToLocationId,
                Status = Draft,
                CreatedAt = now,
                CreatedById = userId,
                CreatedByName = userName,
                Note = dto.Note
            };

            await _unitOfWork.TransferOrder.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            foreach (var itemDto in dto.Items)
            {
                var item = new TransferOrderItem
                {
                    TransferOrderId = order.Id,
                    ProductId = itemDto.ProductId,
                    RequestedQty = itemDto.RequestedQty,
                    TransferredQty = 0
                };
                await _unitOfWork.TransferOrderItem.AddAsync(item);
            }

            // Tạo StockDocument liên kết
            var stockDoc = new StockDocument
            {
                DocumentNo = transferNo,
                DocumentType = StockDocumentType.TransferOrder.ToString(),
                ReferenceType = StockDocumentReferenceType.TransferOrder.ToString(),
                ReferenceId = order.Id,
                Origin = $"Transfer Order {transferNo}",
                FromLocationId = dto.FromLocationId,
                ToLocationId = dto.ToLocationId,
                Status = StockPending,
                CreatedAt = now
            };
            await _unitOfWork.StockDocument.AddAsync(stockDoc);
            await _unitOfWork.SaveChangesAsync();

            // Tạo StockTransactions
            var createdOrder = await GetOrderWithItemsOrThrow(order.Id);
            foreach (var item in createdOrder.TransferOrderItems)
            {
                var product = await _unitOfWork.Product.GetByIdAsync(item.ProductId);
                var selectedLot = await SelectLotForTransaction(item.ProductId, dto.FromLocationId);
                var transaction = new StockTransaction
                {
                    DocumentId = stockDoc.Id,
                    ProductId = item.ProductId,
                    UomId = product?.BaseUomId,
                    PlannedQty = item.RequestedQty,
                    ActualQty = 0,
                    ReservedQty = 0,
                    FromLocationId = dto.FromLocationId,
                    ToLocationId = dto.ToLocationId,
                    LotId = selectedLot?.Id,
                    TransactionType = StockTransactionType.TransferOrder.ToString(),
                    Status = StockPending,
                    CreatedAt = now,
                    PlannedDate = dto.PlannedDate.Date
                };
                await _unitOfWork.StockTransaction.AddAsync(transaction);
            }
            await _unitOfWork.SaveChangesAsync();

            return MapDetail(createdOrder, stockDoc.Id, dto.PlannedDate.Date);
        }

        // ===== UPDATE HEADER =====

        public async Task<TransferOrderDetailDto> UpdateAsync(int? managerId, int userId, int id, UpdateTransferOrderDto dto)
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

            if (dto.FromLocationId.HasValue)
            {
                var fromLoc = await _unitOfWork.Location.GetByIdAsync(dto.FromLocationId.Value);
                if (fromLoc == null) throw new NotFoundException("From location not found.");
                if (!fromLoc.WarehouseId.HasValue || !managerWarehouseIds.Contains(fromLoc.WarehouseId.Value))
                    throw new BadRequestException("From location must belong to one of the warehouses managed by the staff's manager.");
                order.FromLocationId = dto.FromLocationId.Value;
            }

            if (dto.ToLocationId.HasValue)
            {
                var toLoc = await _unitOfWork.Location.GetByIdAsync(dto.ToLocationId.Value);
                if (toLoc == null) throw new NotFoundException("To location not found.");
                if (!toLoc.WarehouseId.HasValue || !managerWarehouseIds.Contains(toLoc.WarehouseId.Value))
                    throw new BadRequestException("To location must belong to one of the warehouses managed by the staff's manager.");
                order.ToLocationId = dto.ToLocationId.Value;
            }

            if (order.FromLocationId == order.ToLocationId)
                throw new BadRequestException("FromLocation and ToLocation must be different.");

            if (order.ToLocationId <= 0)
                throw new BadRequestException("ToLocationId is required.");

            order.Note = dto.Note;
            await _unitOfWork.TransferOrder.UpdateAsync(order);

            // Đồng bộ location vào StockDocument + StockTransactions
            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc != null)
            {
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docDetail != null)
                {
                    if (dto.FromLocationId.HasValue)
                    {
                        docDetail.FromLocationId = order.FromLocationId;
                        foreach (var t in docDetail.StockTransactions)
                        {
                            t.FromLocationId = order.FromLocationId;
                            await _unitOfWork.StockTransaction.UpdateAsync(t);
                        }
                    }
                    if (dto.ToLocationId.HasValue)
                    {
                        docDetail.ToLocationId = order.ToLocationId;
                        foreach (var t in docDetail.StockTransactions)
                        {
                            t.ToLocationId = order.ToLocationId;
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

            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(id);
            var plannedDate = await GetPlannedDateFromOrderAsync(id);
            return MapDetail(updated, stockDoc?.Id, plannedDate);
        }

        // ===== DELETE =====

        public async Task DeleteAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            EnsureDraft(order.Status);

            // Xóa StockTransactions + StockDocument
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

            foreach (var item in order.TransferOrderItems.ToList())
                await _unitOfWork.TransferOrderItem.DeleteAsync(item);

            await _unitOfWork.TransferOrder.DeleteAsync(order);
            await _unitOfWork.SaveChangesAsync();
        }

        // ===== CRUD ITEMS =====

        public async Task<TransferOrderDetailDto> AddItemAsync(int orderId, TransferOrderItemUpsertDto dto)
        {
            var order = await GetOrderOrThrow(orderId);
            EnsureDraft(order.Status);
            await ValidateProduct(dto.ProductId);
            if (dto.RequestedQty <= 0) throw new BadRequestException("RequestedQty must be greater than 0.");

            var existingItems = await _unitOfWork.TransferOrderItem.GetByTransferOrderIdAsync(orderId);
            if (existingItems.Any(i => i.ProductId == dto.ProductId))
                throw new BadRequestException($"Product {dto.ProductId} already exists in transfer order.");

            var item = new TransferOrderItem
            {
                TransferOrderId = orderId,
                ProductId = dto.ProductId,
                RequestedQty = dto.RequestedQty,
                TransferredQty = 0
            };
            await _unitOfWork.TransferOrderItem.AddAsync(item);

            // Sync StockTransaction
            var stockDoc = await FindLinkedStockDocument(orderId);
            if (stockDoc != null)
            {
                var product = await _unitOfWork.Product.GetByIdAsync(dto.ProductId);
                var selectedLot = await SelectLotForTransaction(dto.ProductId, order.FromLocationId);
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                var existingTx = docDetail?.StockTransactions.FirstOrDefault();
                var transaction = new StockTransaction
                {
                    DocumentId = stockDoc.Id,
                    ProductId = dto.ProductId,
                    UomId = product?.BaseUomId,
                    PlannedQty = dto.RequestedQty,
                    ActualQty = 0,
                    ReservedQty = 0,
                    FromLocationId = order.FromLocationId,
                    ToLocationId = order.ToLocationId,
                    LotId = selectedLot?.Id,
                    TransactionType = StockTransactionType.TransferOrder.ToString(),
                    Status = stockDoc.Status,
                    CreatedAt = DateTime.UtcNow,
                    PlannedDate = existingTx?.PlannedDate ?? DateTime.UtcNow.Date
                };
                await _unitOfWork.StockTransaction.AddAsync(transaction);
            }

            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(orderId);
            var plannedDate = await GetPlannedDateFromOrderAsync(orderId);
            return MapDetail(updated, stockDoc?.Id, plannedDate);
        }

        public async Task<TransferOrderDetailDto> UpdateItemAsync(int orderId, int itemId, TransferOrderItemUpsertDto dto)
        {
            var order = await GetOrderOrThrow(orderId);
            EnsureDraft(order.Status);

            var item = await _unitOfWork.TransferOrderItem.GetByIdAsync(itemId);
            if (item == null || item.TransferOrderId != orderId)
                throw new NotFoundException("Transfer order item not found.");

            var existingItems = await _unitOfWork.TransferOrderItem.GetByTransferOrderIdAsync(orderId);
            if (existingItems.Any(i => i.Id != itemId && i.ProductId == dto.ProductId))
                throw new BadRequestException($"Product {dto.ProductId} already exists in transfer order.");

            await ValidateProduct(dto.ProductId);
            if (dto.RequestedQty <= 0) throw new BadRequestException("RequestedQty must be greater than 0.");

            // Sync StockTransaction
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
                        var selectedLot = await SelectLotForTransaction(dto.ProductId, order.FromLocationId);
                        matchingTx.ProductId = dto.ProductId;
                        matchingTx.UomId = product?.BaseUomId;
                        matchingTx.PlannedQty = dto.RequestedQty;
                        matchingTx.LotId = selectedLot?.Id;
                        await _unitOfWork.StockTransaction.UpdateAsync(matchingTx);
                    }
                }
            }

            item.ProductId = dto.ProductId;
            item.RequestedQty = dto.RequestedQty;
            await _unitOfWork.TransferOrderItem.UpdateAsync(item);

            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(orderId);
            var plannedDate = await GetPlannedDateFromOrderAsync(orderId);
            return MapDetail(updated, stockDoc?.Id, plannedDate);
        }

        public async Task<TransferOrderDetailDto> DeleteItemAsync(int orderId, int itemId)
        {
            var order = await GetOrderOrThrow(orderId);
            EnsureDraft(order.Status);

            var item = await _unitOfWork.TransferOrderItem.GetByIdAsync(itemId);
            if (item == null || item.TransferOrderId != orderId)
                throw new NotFoundException("Transfer order item not found.");

            // Sync xóa StockTransaction
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

            await _unitOfWork.TransferOrderItem.DeleteAsync(item);
            await _unitOfWork.SaveChangesAsync();

            var updated = await GetOrderWithItemsOrThrow(orderId);
            var plannedDate = await GetPlannedDateFromOrderAsync(orderId);
            return MapDetail(updated, stockDoc?.Id, plannedDate);
        }

        // ===== STATUS WORKFLOW =====

        public async Task<TransferOrderDetailDto> CheckAvailabilityAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            if (order.Status != Draft && order.Status != Waiting)
                throw new BadRequestException("Can only check availability from Draft or Waiting status.");

            if (!order.TransferOrderItems.Any())
                throw new BadRequestException("Transfer order must have at least one item.");

            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc == null)
                throw new BadRequestException("Linked stock document not found.");

            // Check inventory availability at From Location
            bool isEnoughStock = true;
            foreach (var item in order.TransferOrderItems)
            {
                var qty = item.RequestedQty ?? 0;
                var inventories = await _unitOfWork.CurrentInventory.GetAvailableByProductLocationAsync(
                    item.ProductId, order.FromLocationId);
                var totalQty = inventories.Sum(x => x.Quantity ?? 0);

                if (totalQty < qty)
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
                foreach (var item in order.TransferOrderItems)
                {
                    var inventories = await GetOrderedInventoriesForLotSplit(
                        item.ProductId, order.FromLocationId);

                    var remaining = item.RequestedQty ?? 0;
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
                order.ConfirmedAt = DateTime.UtcNow;
            }

            await _unitOfWork.TransferOrder.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            var result = await GetOrderWithItemsOrThrow(id);
            var plannedDate = await GetPlannedDateFromOrderAsync(id);
            return MapDetail(result, stockDoc.Id, plannedDate);
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

        public async Task<TransferOrderDetailDto> MarkDoneAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            if (order.Status != Ready)
                throw new BadRequestException("Transfer order must be ready before completing.");

            if (!order.TransferOrderItems.Any())
                throw new BadRequestException("Transfer order must have at least one item.");

            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc == null)
                throw new BadRequestException("Linked stock document not found.");

            var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
            if (docDetail == null)
                throw new BadRequestException("Stock document details not found.");

            if (!docDetail.FromLocationId.HasValue || !docDetail.ToLocationId.HasValue)
                throw new BadRequestException("From and to locations are required before completing.");

            // Check available inventory at From Location (check total Quantity)
            foreach (var item in order.TransferOrderItems)
            {
                var qty = item.RequestedQty ?? 0;
                var inventories = await _unitOfWork.CurrentInventory.GetAllByProductLocationAsync(
                    item.ProductId, order.FromLocationId);
                var totalQty = inventories.Sum(x => x.Quantity ?? 0);

                if (totalQty < qty)
                    throw new BadRequestException($"Insufficient stock for product {item.ProductId}. Required {qty}, available {totalQty}.");
            }

            var now = DateTime.UtcNow;

            // Trừ tồn kho dự trữ khi chuyển sang done (nếu đã reserve trước đó)
            foreach (var item in order.TransferOrderItems)
            {
                var inventories = await GetOrderedReservedInventories(item.ProductId, order.FromLocationId);

                var remaining = item.RequestedQty ?? 0;
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

            // Trừ kho From, cộng kho To theo từng lot (giữ nguyên ProductId + LotId)
            foreach (var item in order.TransferOrderItems)
            {
                var qty = item.RequestedQty ?? 0;
                var inventories = await GetOrderedInventoriesForCompletion(item.ProductId, order.FromLocationId);

                var remaining = qty;
                foreach (var fromInventory in inventories)
                {
                    if (remaining <= 0) break;

                    var availableQty = fromInventory.Quantity ?? 0;
                    var take = Math.Min(availableQty, remaining);
                    if (take <= 0) continue;

                    // 1) Trừ kho nguồn
                    fromInventory.Quantity = availableQty - take;
                    await _unitOfWork.CurrentInventory.UpdateAsync(fromInventory);

                    // 2) Cộng kho đích với cùng ProductId + LotId
                    var toInventory = await _unitOfWork.CurrentInventory.GetByProductLocationLotAsync(
                        item.ProductId, order.ToLocationId, fromInventory.LotId);

                    if (toInventory == null)
                    {
                        toInventory = new CurrentInventory
                        {
                            ProductId = item.ProductId,
                            LocationId = order.ToLocationId,
                            LotId = fromInventory.LotId,
                            Quantity = take,
                            ReservedQuantity = 0
                        };
                        await _unitOfWork.CurrentInventory.AddAsync(toInventory);
                    }
                    else
                    {
                        toInventory.Quantity = (toInventory.Quantity ?? 0) + take;
                        await _unitOfWork.CurrentInventory.UpdateAsync(toInventory);
                    }

                    remaining -= take;
                }

                if (remaining > 0)
                    throw new BadRequestException($"Insufficient stock for product {item.ProductId} while completing.");

                // Cập nhật TransferredQty
                item.TransferredQty = qty;
                await _unitOfWork.TransferOrderItem.UpdateAsync(item);
            }

            // Cập nhật Order
            order.Status = Done;
            order.CompletedAt = now;
            await _unitOfWork.TransferOrder.UpdateAsync(order);

            // Cập nhật StockDocument + Transactions
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
            var plannedDate = await GetPlannedDateFromOrderAsync(id);
            return MapDetail(result, stockDoc.Id, plannedDate);
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

        // ===== CANCEL (pending → cancelled) =====

        public async Task<TransferOrderDetailDto> CancelAsync(int id)
        {
            var order = await GetOrderWithItemsOrThrow(id);
            if (order.Status == Done)
                throw new BadRequestException("Completed transfer order cannot be cancelled.");
            if (order.Status == Cancelled)
                throw new BadRequestException("Transfer order is already cancelled.");

            order.Status = Cancelled;
            order.CompletedAt = DateTime.UtcNow;
            await _unitOfWork.TransferOrder.UpdateAsync(order);

            var stockDoc = await FindLinkedStockDocument(id);
            if (stockDoc != null)
            {
                var docDetail = await _unitOfWork.StockDocument.GetByIdWithDetailsAsync(stockDoc.Id);
                if (docDetail != null)
                {
                    if (docDetail.FromLocationId.HasValue)
                    {
                        foreach (var item in order.TransferOrderItems)
                        {
                            var inventories = await GetOrderedReservedInventories(
                                item.ProductId, docDetail.FromLocationId.Value);

                            var remaining = item.RequestedQty ?? 0;
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
            var plannedDate = await GetPlannedDateFromOrderAsync(id);
            return MapDetail(result, stockDoc?.Id, plannedDate);
        }

        // ===== PRIVATE HELPERS =====

        private async Task<string> GenerateTransferNoAsync()
        {
            const string prefix = "TO";
            var year = DateTime.UtcNow.Year;

            var all = await _unitOfWork.TransferOrder.GetAllAsync();

            var count = all.Count(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Year == year);

            return $"{prefix}-{year}-{count + 1:D3}";
        }

        private async Task<TransferOrder> GetOrderOrThrow(int id)
        {
            if (id <= 0) throw new BadRequestException("Id is invalid.");
            var order = await _unitOfWork.TransferOrder.GetByIdAsync(id);
            if (order == null) throw new NotFoundException("Transfer order not found.");
            return order;
        }

        private async Task<TransferOrder> GetOrderWithItemsOrThrow(int id)
        {
            if (id <= 0) throw new BadRequestException("Id is invalid.");
            var order = await _unitOfWork.TransferOrder.GetByIdWithItemsAsync(id);
            if (order == null) throw new NotFoundException("Transfer order not found.");
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
                throw new BadRequestException("Operation only allowed when transfer order is in draft status.");
        }

        private async Task<StockDocument?> FindLinkedStockDocument(int orderId)
        {
            return await _unitOfWork.StockDocument.GetByReferenceWithDetailsAsync(
                StockDocumentReferenceType.TransferOrder.ToString(), orderId);
        }

        private async Task<DateTime?> GetPlannedDateFromOrderAsync(int orderId)
        {
            var doc = await FindLinkedStockDocument(orderId);
            return doc?.StockTransactions?.FirstOrDefault()?.PlannedDate;
        }

        // ===== MAPPING =====

        private TransferOrderListItemDto MapListItem(TransferOrder o, DateTime? plannedDate)
        {
            return new TransferOrderListItemDto
            {
                Id = o.Id,
                TransferNo = o.TransferNo,
                FromLocationId = o.FromLocationId,
                FromLocationName = o.FromLocation?.Name,
                ToLocationId = o.ToLocationId,
                ToLocationName = o.ToLocation?.Name,
                Status = o.Status,
                CreatedByName = o.CreatedByName,
                Note = o.Note,
                CreatedAt = o.CreatedAt,
                ConfirmedAt = o.ConfirmedAt,
                CompletedAt = o.CompletedAt,
                PlannedDate = plannedDate
            };
        }

        private TransferOrderDetailDto MapDetail(TransferOrder o, int? stockDocumentId, DateTime? plannedDate)
        {
            return new TransferOrderDetailDto
            {
                Id = o.Id,
                TransferNo = o.TransferNo,
                FromLocationId = o.FromLocationId,
                FromLocationName = o.FromLocation?.Name,
                ToLocationId = o.ToLocationId,
                ToLocationName = o.ToLocation?.Name,
                Status = o.Status,
                CreatedByName = o.CreatedByName,
                Note = o.Note,
                CreatedAt = o.CreatedAt,
                ConfirmedAt = o.ConfirmedAt,
                CompletedAt = o.CompletedAt,
                PlannedDate = plannedDate,
                StockDocumentId = stockDocumentId,
                Items = o.TransferOrderItems
                    .OrderBy(x => x.Id)
                    .Select(i => new TransferOrderItemDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product?.Name,
                        RequestedQty = i.RequestedQty,
                        TransferredQty = i.TransferredQty
                    })
                    .ToList()
            };
        }

        // khac warehouse


        private async Task<Location> ValidateLocationBelongsToManagerWarehouses(
     int locationId, HashSet<int> managerWarehouseIds, string fieldName)
        {
            var loc = await _unitOfWork.Location.GetByIdAsync(locationId);
            if (loc == null)
                throw new NotFoundException($"{fieldName} location not found.");

            if (!loc.WarehouseId.HasValue || !managerWarehouseIds.Contains(loc.WarehouseId.Value))
                throw new BadRequestException($"{fieldName} location must belong to manager warehouses.");

            return loc;
        }

        private async Task ValidateProductLocationCompatibilityAsync(int productId, int locationId, string fieldName)
        {
            var product = await _unitOfWork.Product.GetByIdAsync(productId);
            if (product == null || product.IsActive != true)
                throw new BadRequestException("Product is inactive.");

            var location = await _unitOfWork.Location.GetByIdAsync(locationId);
            if (location == null || location.IsActive != true)
                throw new BadRequestException("Location is inactive.");

            if (location.Type != product.ProductType)
                throw new BadRequestException($"Product {productId} cannot be stored in {fieldName} location {locationId} because types do not match.");
        }
        public async Task<TransferOrderDetailDto> CreateTransferOrderAsync(
    int? managerId, int userId, string? userName, CreateTransferOrderDto dto)
        {
            if (dto.FromLocationId <= 0) throw new BadRequestException("FromLocationId is required.");
            if (dto.ToLocationId <= 0) throw new BadRequestException("ToLocationId is required.");
            if (dto.FromLocationId == dto.ToLocationId)
                throw new BadRequestException("FromLocation and ToLocation must be different.");

            var now = DateTime.UtcNow;
            if (dto.PlannedDate == default || dto.PlannedDate.Date < now.Date)
                throw new BadRequestException("PlannedDate must be provided and cannot be in the past.");

            int effectiveManagerId = managerId ?? userId;
            var managerWarehouses = (await _unitOfWork.Warehouse.GetByManagerIdAsync(effectiveManagerId)).ToList();
            var managerWarehouseIds = managerWarehouses.Select(w => w.Id).ToHashSet();

            if (!managerWarehouseIds.Any())
                throw new BadRequestException("No warehouses found for this manager/user.");

            var fromLoc = await ValidateLocationBelongsToManagerWarehouses(dto.FromLocationId, managerWarehouseIds, "From");
            var toLoc = await ValidateLocationBelongsToManagerWarehouses(dto.ToLocationId, managerWarehouseIds, "To");

            var productIds = new HashSet<int>();
            foreach (var itemDto in dto.Items)
            {
                if (!productIds.Add(itemDto.ProductId))
                    throw new BadRequestException($"Product {itemDto.ProductId} already exists.");
                await ValidateProduct(itemDto.ProductId);
                if (itemDto.RequestedQty <= 0) throw new BadRequestException("RequestedQty must be greater than 0.");

                await ValidateProductLocationCompatibilityAsync(itemDto.ProductId, dto.FromLocationId, "From");
                await ValidateProductLocationCompatibilityAsync(itemDto.ProductId, dto.ToLocationId, "To");
            }

            var transferNo = await GenerateTransferNoAsync();
            var order = new TransferOrder
            {
                TransferNo = transferNo,
                FromLocationId = dto.FromLocationId,
                ToLocationId = dto.ToLocationId,
                Status = Draft,
                CreatedAt = now,
                CreatedById = userId,
                CreatedByName = userName,
                Note = dto.Note
            };
            await _unitOfWork.TransferOrder.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            foreach (var itemDto in dto.Items)
            {
                var item = new TransferOrderItem
                {
                    TransferOrderId = order.Id,
                    ProductId = itemDto.ProductId,
                    RequestedQty = itemDto.RequestedQty,
                    TransferredQty = 0
                };
                await _unitOfWork.TransferOrderItem.AddAsync(item);
            }

            var stockDoc = new StockDocument
            {
                DocumentNo = transferNo,
                DocumentType = StockDocumentType.TransferOrder.ToString(),
                ReferenceType = StockDocumentReferenceType.TransferOrder.ToString(),
                ReferenceId = order.Id,
                Origin = $"Transfer Order {transferNo}",
                FromLocationId = dto.FromLocationId,
                ToLocationId = dto.ToLocationId,
                Status = StockPending,
                CreatedAt = now
            };
            await _unitOfWork.StockDocument.AddAsync(stockDoc);
            await _unitOfWork.SaveChangesAsync();

            var createdOrder = await GetOrderWithItemsOrThrow(order.Id);
            foreach (var item in createdOrder.TransferOrderItems)
            {
                var product = await _unitOfWork.Product.GetByIdAsync(item.ProductId);
                var selectedLot = await SelectLotForTransaction(item.ProductId, dto.FromLocationId);
                var transaction = new StockTransaction
                {
                    DocumentId = stockDoc.Id,
                    ProductId = item.ProductId,
                    UomId = product?.BaseUomId,
                    PlannedQty = item.RequestedQty,
                    ActualQty = 0,
                    ReservedQty = 0,
                    FromLocationId = dto.FromLocationId,
                    ToLocationId = dto.ToLocationId,
                    LotId = selectedLot?.Id,
                    TransactionType = StockTransactionType.TransferOrder.ToString(),
                    Status = StockPending,
                    CreatedAt = now,
                    PlannedDate = dto.PlannedDate.Date
                };
                await _unitOfWork.StockTransaction.AddAsync(transaction);
            }
            await _unitOfWork.SaveChangesAsync();

            return MapDetail(createdOrder, stockDoc.Id, dto.PlannedDate.Date);
        }


    }
}
