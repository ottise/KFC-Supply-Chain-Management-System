using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Inventory.Application.DTOs;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class PurchaseOrderOrchestrate : IPurchaseOrderOrchestrate
    {
        private readonly IPurchaseOrderService _purchaseOrderService;
        private readonly IStockDocumentService _stockDocumentService;
        private readonly IPurchaseOrderItemService _purchaseOrderItemService;
        private readonly IStockTransactionService _stockTransactionService;
        private readonly ICurrentInventoryService _currentInventoryService;
        private readonly IProductService _productService;
        private readonly ISupplierService _supplierService;
        private readonly IProductLotService _lotService;
        private readonly IUomService _uomService;
        private readonly IWarehouseService _warehouseService;
        private readonly ILocationService _locationService;

        private readonly IUnitOfWork _unitOfWork;

        public PurchaseOrderOrchestrate(
            IPurchaseOrderService purchaseOrderService,
            IStockDocumentService stockDocumentService,
            IPurchaseOrderItemService purchaseOrderItemService,
            IStockTransactionService stockTransactionService,
            ICurrentInventoryService currentInventoryService,
            IProductService productService,
            ISupplierService supplierService,
            IProductLotService lotService,
            IUomService uomService,
            IWarehouseService warehouseService,
            ILocationService locationService,
            IUnitOfWork unitOfWork)
        {
            _purchaseOrderService = purchaseOrderService;
            _stockDocumentService = stockDocumentService;
            _purchaseOrderItemService = purchaseOrderItemService;
            _stockTransactionService = stockTransactionService;
            _currentInventoryService = currentInventoryService;
            _productService = productService;
            _supplierService = supplierService;
            _lotService = lotService;
            _uomService = uomService;
            _warehouseService = warehouseService;
            _locationService = locationService;
            _unitOfWork = unitOfWork;
        }

        public async Task<CreateDraftPurchaseOrderInputDto> CreateDraftPurchaseOrderAsync(CreateDraftPurchaseOrderInputDto input, int? managerId, int userId)
        {
            var effectiveManagerId = managerId ?? userId;
            if (effectiveManagerId <= 0)
                throw new ArgumentException("ManagerId hoặc UserId hợp lệ là bắt buộc");


            if (input.ToLocationId == null || input.ToLocationId == 0)
                throw new ArgumentException("Kho nhận hàng là bắt buộc và không được để trống hoặc bằng 0");

            StockDocument existingDoc = null;
            if (input.DocId > 0)
            {
                existingDoc = await _stockDocumentService.GetStockDocumentById(input.DocId);

                if (existingDoc != null && existingDoc.Status == StockDocumentStatus.Completed.ToString())
                    throw new InvalidOperationException("Không thể tạo mới từ chứng từ đã hoàn tất");

                var authLocations = await GetAuthorizedLocationIdsAsync(effectiveManagerId);
                if (existingDoc.ToLocationId.HasValue && !authLocations.Contains(existingDoc.ToLocationId.Value) &&
                    existingDoc.FromLocationId.HasValue && !authLocations.Contains(existingDoc.FromLocationId.Value))
                    throw new InvalidOperationException("Manager không có quyền quản lý chứng từ này");
            }
            else
            {
                var authLocations = await GetAuthorizedLocationIdsAsync(effectiveManagerId);

                if (input.ToLocationId.HasValue && !authLocations.Contains(input.ToLocationId.Value))
                    throw new InvalidOperationException("Manager không có quyền nhập hàng ở kho này");
            }

            if (input.PlannedDate < DateTime.UtcNow.Date)
                throw new ArgumentException("Ngày kế hoạch không được là ngày trong quá khứ");

            PurchaseOrder po;

            StockDocument doc = null;

            if (existingDoc != null)
            {
                po = await _purchaseOrderService.GetByIdAsync(existingDoc.ReferenceId.Value);
                input.DocId = existingDoc.Id;
                doc = existingDoc;
                doc.Origin = input.Origin; // Update origin
                po.PlannedDate = input.PlannedDate;
                await _stockDocumentService.UpdateStockDocument(doc);
                await _purchaseOrderService.UpdatePurchaseOrder(po);
            }
            else
            {
                //nguyen dong var nay

                var supplier = await _supplierService.GetSupplierByIdAsync(input.SupplierId);
                if (supplier == null)
                {
                    throw new ArgumentException($"Không tìm thấy nhà cung cấp với Id {input.SupplierId}");
                }

                po = await _purchaseOrderService.CreatePurchaseOrder(new PurchaseOrder
                {
                    SupplierId = supplier.Id,
                    CreatedById = userId,
                    Status = PurchaseOrderStatus.Draft.ToString(),
                    CreatedAt = DateTime.UtcNow,
                    ConfirmedAt = null,
                    CompletedAt = null,
                    ToLocationId = input.ToLocationId,
                    PlannedDate = input.PlannedDate
                });

                var countPo = (await _stockDocumentService.GetAllAsync()).Count();
                var docNo = $"PO-{DateTime.UtcNow.Year}-{countPo + 1:D3}";

                doc = await _stockDocumentService.CreateStockDocumentPurchase(new StockDocument
                {
                    DocumentNo = docNo,
                    DocumentType = StockDocumentType.PurchaseOrder.ToString(),
                    ReferenceType = StockDocumentReferenceType.PurchaseOrder.ToString(),
                    ReferenceId = po.Id,
                    Origin = input.Origin,
                    FromLocationId = supplier.Id,
                    ToLocationId = input.ToLocationId,
                    Status = StockDocumentStatus.Draft.ToString(),
                    CreatedAt = null,
                    CompletedAt = null
                });
                input.DocId = doc.Id;
            }

            var groupedItems = input.Items
                .GroupBy(i => new { i.ProductId, i.LotId, i.LotName })
                .Select(g => new CreateDraftPurchaseOrderItemDto
                {
                    ProductId = g.Key.ProductId,
                    LotId = g.Key.LotId,
                    LotName = g.Key.LotName,
                    Quantity = g.Sum(x => x.Quantity),
                    ExpirationDate = g.Max(x => x.ExpirationDate)
                }).ToList();

            var transactions = await _stockTransactionService.GetByDocumentId(doc.Id);

            foreach (var item in groupedItems)
            {
                if (item.ExpirationDate == default || item.ExpirationDate <= DateTime.UtcNow.Date)
                    throw new ArgumentException("Ngày hết hạn phải từ ngày mai trở đi");

                var lot = await _lotService.GetByIdAsync(item.LotId);
                // ... (lot creation logic remains same)
                if (lot == null)
                {
                    if (string.IsNullOrWhiteSpace(item.LotName))
                        throw new ArgumentException($"Không tìm thấy lô {item.LotId} và LotName là bắt buộc để tạo mới lô");

                    if (item.ExpirationDate == default)
                        throw new ArgumentException("Ngày hết hạn là bắt buộc khi tạo mới lô");

                    var newLot = await _lotService.CreateProductLot(new ProductLot
                    {
                        ProductId = item.ProductId,
                        LotNumber = item.LotName,
                        ExpirationDate = item.ExpirationDate,
                    });

                    item.LotId = newLot.Id;
                }

                var product = await _productService.GetByIdAsync(item.ProductId);
                if (product == null) throw new ArgumentException($"Product {item.ProductId} not found");

                var existingItem = await _purchaseOrderItemService.GetByPurchaseOrderIdAndProductIdAndLotId(po.Id, item.ProductId, item.LotId);

                if (existingItem != null)
                {
                    existingItem.OrderedQty = item.Quantity;
                    existingItem.Subtotal = existingItem.UnitPrice * existingItem.OrderedQty;
                    await _purchaseOrderItemService.UpdatePurchaseOrderItem(existingItem);
                }
                else
                {
                    await _purchaseOrderItemService.CreatePurchaseOrderItem(new PurchaseOrderItem
                    {
                        PurchaseOrderId = po.Id,
                        ProductId = item.ProductId,
                        LotId = item.LotId,
                        OrderedQty = item.Quantity,
                        ReceivedQty = null,
                        UnitPrice = product.StockPrice,
                        Subtotal = product.StockPrice * item.Quantity
                    });
                }

                var inventory = await _currentInventoryService.GetCurrentInventoryByLotIdAndProductIdAndLocationId(item.ProductId, item.LotId, (int)input.ToLocationId);
                var reservedQty = inventory?.ReservedQuantity ?? 0;

                var existingTransaction = transactions.FirstOrDefault(t =>
                    t.ProductId == item.ProductId &&
                    t.LotId == item.LotId &&
                    t.Status == StockTransactionStatus.Draft.ToString());

                if (existingTransaction != null)
                {
                    existingTransaction.PlannedQty = item.Quantity;
                    existingTransaction.ReservedQty = reservedQty;
                    existingTransaction.PlannedDate = input.PlannedDate;
                    await _stockTransactionService.UpdateStockTransaction(existingTransaction);
                }
                else
                {
                    await _stockTransactionService.CreateStockTransactionPurchase(new StockTransaction
                    {
                        DocumentId = doc.Id,
                        ProductId = item.ProductId,
                        LotId = item.LotId,
                        PlannedQty = item.Quantity,
                        ActualQty = null,
                        UomId = product.PurchaseUomId,
                        FromLocationId = input.SupplierId,
                        ToLocationId = input.ToLocationId,
                        ReservedQty = reservedQty,
                        TransactionType = StockTransactionType.Receipt.ToString(),
                        Status = StockTransactionStatus.Draft.ToString(),
                        PlannedDate = input.PlannedDate,
                        CreatedAt = null,
                        CompletedAt = null
                    });
                }
            }
            return input;

        }



        public async Task<CreateCompletePurchaseOrderInputDto> CompletePurchaseOrderAsync(
        CreateCompletePurchaseOrderInputDto input, int? managerId, int userId)
        {
            var effectiveManagerId = managerId ?? userId;
            if (effectiveManagerId <= 0)
                throw new ArgumentException("ManagerId hoặc UserId hợp lệ là bắt buộc");

            if (input.ToLocationId == null || input.ToLocationId == 0)
                throw new ArgumentException("Kho nhận hàng là bắt buộc và không được để trống hoặc bằng 0");

            StockDocument existingDoc = null;
            if (input.DocId > 0)
            {
                existingDoc = await _stockDocumentService.GetStockDocumentById(input.DocId);
                if (existingDoc != null && existingDoc.Status == StockDocumentStatus.Completed.ToString())
                    throw new InvalidOperationException("Không thể Completed chứng từ đã hoàn tất");

                var authLocations = await GetAuthorizedLocationIdsAsync(effectiveManagerId);
                if (existingDoc.ToLocationId.HasValue && !authLocations.Contains(existingDoc.ToLocationId.Value) &&
                    existingDoc.FromLocationId.HasValue && !authLocations.Contains(existingDoc.FromLocationId.Value))
                    throw new InvalidOperationException("Manager không có quyền quản lý chứng từ này");
            }
            else
            {
                var authLocations = await GetAuthorizedLocationIdsAsync(effectiveManagerId);
                if (input.ToLocationId.HasValue && !authLocations.Contains(input.ToLocationId.Value))
                    throw new InvalidOperationException("Manager không có quyền nhập hàng ở kho này");
            }

            if (input.PlannedDate < DateTime.UtcNow.Date)
                throw new ArgumentException("Ngày kế hoạch (Hoàn thành) không được là ngày trong quá khứ");

            var groupedItems = input.Items
                .GroupBy(i => new { i.ProductId, i.LotId, i.LotName })
                .Select(g => new CreateCompletedPurchaseOrderItemDto
                {
                    ProductId = g.Key.ProductId,
                    LotId = g.Key.LotId,
                    LotName = g.Key.LotName,
                    Quantity = g.Sum(x => x.Quantity),
                    RealQuantity = g.Sum(x => x.RealQuantity),
                    ExpirationDate = g.Max(x => x.ExpirationDate)
                }).ToList();

            PurchaseOrder po;
            StockDocument doc;

            if (existingDoc != null)
            {
                po = await _purchaseOrderService.GetByIdAsync(existingDoc.ReferenceId.Value);
                if (po.Status != PurchaseOrderStatus.Confirmed.ToString()
                && po.Status != PurchaseOrderStatus.PartiallyReceived.ToString())
                {
                    throw new InvalidOperationException("Chỉ đơn Confirmed hoặc PartiallyReceived mới được Completed");
                }


                doc = existingDoc;
            }
            else
            {
                var supplier = await _supplierService.GetSupplierById(input.SupplierId);
                if (supplier == null)
                {
                    throw new ArgumentException($"Không tìm thấy nhà cung cấp với Id {input.SupplierId}");
                }


                po = await _purchaseOrderService.CreatePurchaseOrder(new PurchaseOrder
                {
                    SupplierId = supplier.Id,
                    CreatedById = userId,
                    Status = PurchaseOrderStatus.Confirmed.ToString(),
                    ToLocationId = input.ToLocationId,
                    CreatedAt = DateTime.UtcNow,
                    ConfirmedAt = DateTime.UtcNow,
                    PlannedDate = input.PlannedDate
                });

                var countPo = (await _stockDocumentService.GetAllAsync()).Count();
                var docNo = $"PO-{DateTime.UtcNow.Year}-{countPo + 1:D3}";

                doc = await _stockDocumentService.CreateStockDocumentPurchase(new StockDocument
                {
                    DocumentNo = docNo,
                    DocumentType = StockDocumentType.PurchaseOrder.ToString(),
                    ReferenceType = StockDocumentReferenceType.PurchaseOrder.ToString(),
                    ReferenceId = po.Id,
                    FromLocationId = supplier.Id,
                    ToLocationId = input.ToLocationId,
                    Status = StockDocumentStatus.Confirmed.ToString(),
                    CreatedAt = DateTime.UtcNow
                });
            }

            foreach (var item in groupedItems)
            {
                if (item.RealQuantity <= 0)
                    continue;

                var product = await _productService.GetByIdAsync(item.ProductId)
                              ?? throw new ArgumentException($"Không tìm thấy sản phẩm {item.ProductId}");

                var transactions = await _stockTransactionService.GetByDocumentId(doc.Id);
                var confirmedTran = transactions.FirstOrDefault(t =>
                    t.ProductId == item.ProductId &&
                    t.LotId == item.LotId &&
                    t.Status == StockTransactionStatus.Confirmed.ToString());

                decimal planRemaining = confirmedTran?.PlannedQty ?? item.Quantity;

                var poItem = await _purchaseOrderItemService.GetByPurchaseOrderIdAndProductIdAndLotId(po.Id, item.ProductId, item.LotId);
                if (poItem == null)
                {
                    poItem = await _purchaseOrderItemService.CreatePurchaseOrderItem(new PurchaseOrderItem
                    {
                        PurchaseOrderId = po.Id,
                        ProductId = item.ProductId,
                        LotId = item.LotId,
                        OrderedQty = item.Quantity,
                        ReceivedQty = item.RealQuantity,
                        UnitPrice = product.StockPrice,
                        Subtotal = product.StockPrice * item.Quantity
                    });
                }
                else
                {
                    var totalReceived = (poItem.ReceivedQty ?? 0) + item.RealQuantity;

                    if (item.RealQuantity > planRemaining)
                        throw new InvalidOperationException($"Số lượng thực nhập ({item.RealQuantity}) vượt quá số lượng còn lại ({planRemaining}) cho SP {item.ProductId}");

                    if (totalReceived > poItem.OrderedQty)
                        throw new InvalidOperationException($"Tổng nhận ({totalReceived}) vượt quá số lượng đã đặt ({poItem.OrderedQty}) cho SP {item.ProductId}");

                    poItem.ReceivedQty = totalReceived;
                    poItem.Subtotal = poItem.UnitPrice * poItem.OrderedQty;
                    await _purchaseOrderItemService.UpdatePurchaseOrderItem(poItem);
                }

                var inventory = await _currentInventoryService.GetCurrentInventoryByLotIdAndProductIdAndLocationId(
                    item.ProductId, item.LotId, (int)input.ToLocationId);
                var reservedQty = inventory?.ReservedQuantity ?? 0;
                var effectivePurchaseUomId = product.PurchaseUomId ?? product.BaseUomId;
                var ratio = await _uomService.ValidateUomAsync(product.BaseUomId, effectivePurchaseUomId);

                if (item.RealQuantity == planRemaining)
                {
                    if (confirmedTran != null)
                    {
                        confirmedTran.Status = StockTransactionStatus.Completed.ToString();
                        confirmedTran.ActualQty = confirmedTran.PlannedQty;
                        confirmedTran.CompletedAt = DateTime.UtcNow;
                        await _stockTransactionService.UpdateStockTransaction(confirmedTran);
                    }
                    else
                    {
                        await _stockTransactionService.CreateStockTransactionPurchase(new StockTransaction
                        {
                            DocumentId = doc.Id,
                            ProductId = item.ProductId,
                            LotId = item.LotId,
                            PlannedQty = planRemaining,
                            ActualQty = item.RealQuantity,
                            UomId = product.PurchaseUomId,
                            FromLocationId = input.SupplierId,
                            ToLocationId = input.ToLocationId,
                            ReservedQty = reservedQty,
                            TransactionType = StockTransactionType.Receipt.ToString(),
                            Status = StockTransactionStatus.Completed.ToString(),
                            PlannedDate = input.PlannedDate,
                            CreatedAt = DateTime.UtcNow,
                            CompletedAt = DateTime.UtcNow
                        });
                    }

                    if (inventory == null)
                    {
                        await _currentInventoryService.CreateCurrentInventory(new CurrentInventory
                        {
                            ProductId = item.ProductId,
                            LotId = item.LotId,
                            Quantity = item.RealQuantity * ratio,
                            LocationId = input.ToLocationId,
                            ReservedQuantity = 0
                        });
                    }
                    else
                    {
                        inventory.Quantity += item.RealQuantity * ratio;
                        await _currentInventoryService.UpdateCurrentInventory(inventory);
                    }
                }
                else if (item.RealQuantity < planRemaining)
                {
                    if (input.IsSplit)
                    {
                        await _stockTransactionService.CreateStockTransactionPurchase(new StockTransaction
                        {
                            DocumentId = doc.Id,
                            ProductId = item.ProductId,
                            LotId = item.LotId,
                            PlannedQty = item.RealQuantity,
                            ActualQty = item.RealQuantity,
                            UomId = product.PurchaseUomId,
                            FromLocationId = input.SupplierId,
                            ToLocationId = input.ToLocationId,
                            ReservedQty = reservedQty,
                            TransactionType = StockTransactionType.Receipt.ToString(),
                            Status = StockTransactionStatus.Completed.ToString(),
                            PlannedDate = input.PlannedDate,
                            CreatedAt = DateTime.UtcNow,
                            CompletedAt = DateTime.UtcNow
                        });

                        if (inventory == null)
                        {
                            await _currentInventoryService.CreateCurrentInventory(new CurrentInventory
                            {
                                ProductId = item.ProductId,
                                LotId = item.LotId,
                                Quantity = item.RealQuantity * ratio,
                                LocationId = input.ToLocationId,
                                ReservedQuantity = 0
                            });
                        }
                        else
                        {
                            inventory.Quantity += item.RealQuantity * ratio;
                            await _currentInventoryService.UpdateCurrentInventory(inventory);
                        }

                        //var totalReceivedAfterThis = (poItem.ReceivedQty ?? 0) + item.RealQuantity;
                        var totalReceivedAfterThis = poItem.ReceivedQty ?? 0;
                        if (totalReceivedAfterThis < poItem.OrderedQty)
                        {
                            await _stockTransactionService.CreateStockTransactionPurchase(new StockTransaction
                            {
                                DocumentId = doc.Id,
                                ProductId = item.ProductId,
                                LotId = item.LotId,
                                PlannedQty = planRemaining - item.RealQuantity,
                                ActualQty = 0,
                                UomId = product.BaseUomId,
                                FromLocationId = input.SupplierId,
                                ToLocationId = input.ToLocationId,
                                ReservedQty = reservedQty,
                                TransactionType = StockTransactionType.Receipt.ToString(),
                                Status = StockTransactionStatus.Confirmed.ToString(),
                                PlannedDate = input.PlannedDate,
                                CreatedAt = DateTime.UtcNow,
                                CompletedAt = null
                            });

                            po.Status = PurchaseOrderStatus.PartiallyReceived.ToString();
                        }
                        else
                        {
                            po.Status = PurchaseOrderStatus.Completed.ToString();
                        }
                    }
                    else
                    {
                        if (confirmedTran != null)
                        {
                            confirmedTran.Status = StockTransactionStatus.Completed.ToString();
                            confirmedTran.ActualQty = item.RealQuantity;
                            confirmedTran.CompletedAt = DateTime.UtcNow;
                            await _stockTransactionService.UpdateStockTransaction(confirmedTran);
                        }
                        else
                        {
                            await _stockTransactionService.CreateStockTransactionPurchase(new StockTransaction
                            {
                                DocumentId = doc.Id,
                                ProductId = item.ProductId,
                                LotId = item.LotId,
                                PlannedQty = planRemaining,
                                ActualQty = item.RealQuantity,
                                UomId = product.PurchaseUomId,
                                FromLocationId = input.SupplierId,
                                ToLocationId = input.ToLocationId,
                                ReservedQty = reservedQty,
                                TransactionType = StockTransactionType.Receipt.ToString(),
                                Status = StockTransactionStatus.Completed.ToString(),
                                PlannedDate = input.PlannedDate,
                                CreatedAt = DateTime.UtcNow,
                                CompletedAt = DateTime.UtcNow
                            });
                        }


                        if (inventory == null)
                        {
                            await _currentInventoryService.CreateCurrentInventory(new CurrentInventory
                            {
                                ProductId = item.ProductId,
                                LotId = item.LotId,
                                Quantity = item.RealQuantity * ratio,
                                LocationId = input.ToLocationId,
                                ReservedQuantity = 0
                            });
                        }
                        else
                        {
                            inventory.Quantity += item.RealQuantity * ratio;
                            await _currentInventoryService.UpdateCurrentInventory(inventory);
                        }

                        po.Status = PurchaseOrderStatus.Completed.ToString();
                    }
                }

            }

            var items = await _purchaseOrderItemService.GetPurchaseOrderByOrderId(po.Id);
            bool allCompleted = items.All(i => i.ReceivedQty >= i.OrderedQty);

            if (allCompleted)
            {
                po.Status = PurchaseOrderStatus.Completed.ToString();
                po.CompletedAt = DateTime.UtcNow;

                doc.Status = StockDocumentStatus.Completed.ToString();
                doc.CompletedAt = DateTime.UtcNow;
                await _stockDocumentService.UpdateStockDocument(doc);
            }
            else
            {
                if (input.IsSplit)
                {
                    po.Status = PurchaseOrderStatus.PartiallyReceived.ToString();
                }
                else
                {
                    po.Status = PurchaseOrderStatus.Completed.ToString();
                    po.CompletedAt = DateTime.UtcNow;

                    doc.Status = StockDocumentStatus.Completed.ToString();
                    doc.CompletedAt = DateTime.UtcNow;
                    await _stockDocumentService.UpdateStockDocument(doc);
                }
            }

            await _purchaseOrderService.UpdatePurchaseOrder(po);
            return input;
        }


        public async Task<CreateConfirmInventoryAdjustmentDto> ConfirmPurchaseOrderAsync(
      CreateConfirmInventoryAdjustmentDto input, int? managerId, int userId)
        {
            var groupedItems = input.Items
                .GroupBy(i => new { i.ProductId, i.LotId, i.LotName })
                .Select(g => new CreateCompletedPurchaseOrderItemDto
                {
                    ProductId = g.Key.ProductId,
                    LotId = g.Key.LotId,
                    LotName = g.Key.LotName,
                    Quantity = g.Sum(x => x.Quantity),
                    RealQuantity = g.Sum(x => x.RealQuantity),
                    ExpirationDate = g.Max(x => x.ExpirationDate)
                }).ToList();

            if (input.SupplierId <= 0)
                throw new ArgumentException("Nhà cung cấp là bắt buộc và phải lớn hơn 0");

            if (input.ToLocationId == null || input.ToLocationId <= 0)
                throw new ArgumentException("Kho nhận hàng là bắt buộc và phải lớn hơn 0");

            if (groupedItems == null || !groupedItems.Any())
                throw new ArgumentException("Đơn hàng phải có ít nhất một sản phẩm");

            foreach (var item in groupedItems)
            {
                if (item.ProductId <= 0)
                    throw new ArgumentException("Mã sản phẩm phải lớn hơn 0");

                if (item.Quantity <= 0)
                    throw new ArgumentException($"Số lượng đặt cho sản phẩm {item.ProductId} phải lớn hơn 0");
            }

            var effectiveManagerId = managerId ?? userId;
            if (effectiveManagerId <= 0)
                throw new ArgumentException("ManagerId hoặc UserId hợp lệ là bắt buộc");

            StockDocument existingDoc = null;
            if (input.DocId > 0)
            {
                existingDoc = await _stockDocumentService.GetStockDocumentById(input.DocId);

                if (existingDoc != null && existingDoc.Status == StockDocumentStatus.Completed.ToString())
                    throw new InvalidOperationException("Không thể Confirm chứng từ đã hoàn tất");

                var authLocations = await GetAuthorizedLocationIdsAsync(effectiveManagerId);

                if (existingDoc.ToLocationId.HasValue && !authLocations.Contains(existingDoc.ToLocationId.Value) &&
                    existingDoc.FromLocationId.HasValue && !authLocations.Contains(existingDoc.FromLocationId.Value))
                    throw new InvalidOperationException("Manager không có quyền quản lý chứng từ này");
            }
            else
            {
                var authLocations = await GetAuthorizedLocationIdsAsync(effectiveManagerId);

                if (input.ToLocationId.HasValue && !authLocations.Contains(input.ToLocationId.Value))
                    throw new InvalidOperationException("Manager không có quyền nhập hàng ở kho này");
            }

            PurchaseOrder po;
            StockDocument doc;

            if (existingDoc != null)
            {
                po = await _purchaseOrderService.GetByIdAsync(existingDoc.ReferenceId.Value);
                if (po.Status != PurchaseOrderStatus.Draft.ToString())
                    throw new InvalidOperationException("Chỉ đơn Draft mới được Confirm");

                po.Status = PurchaseOrderStatus.Confirmed.ToString();
                po.ConfirmedAt = DateTime.UtcNow;
                po.PlannedDate = input.PlannedDate;
                await _purchaseOrderService.UpdatePurchaseOrder(po);

                // Update Origin if provided
                if (!string.IsNullOrEmpty(input.Origin))
                {
                    existingDoc.Origin = input.Origin;
                }

                existingDoc.Status = StockDocumentStatus.Confirmed.ToString();
                existingDoc.CreatedAt = DateTime.UtcNow;
                await _stockDocumentService.UpdateStockDocument(existingDoc);

                doc = existingDoc;
            }
            else
            {
                po = await _purchaseOrderService.CreatePurchaseOrder(new PurchaseOrder
                {
                    SupplierId = input.SupplierId,
                    CreatedById = userId,
                    Status = PurchaseOrderStatus.Confirmed.ToString(),
                    ToLocationId = input.ToLocationId,
                    CreatedAt = DateTime.UtcNow,
                    ConfirmedAt = DateTime.UtcNow,
                    PlannedDate = input.PlannedDate
                });

                var countPo = (await _stockDocumentService.GetAllAsync()).Count();
                var docNo = $"PO-{DateTime.UtcNow.Year}-{countPo + 1:D3}";

                doc = await _stockDocumentService.CreateStockDocumentPurchase(new StockDocument
                {
                    DocumentNo = docNo,
                    DocumentType = StockDocumentType.PurchaseOrder.ToString(),
                    ReferenceType = StockDocumentReferenceType.PurchaseOrder.ToString(),
                    ReferenceId = po.Id,
                    Origin = input.Origin,
                    FromLocationId = input.SupplierId,
                    ToLocationId = input.ToLocationId,
                    Status = StockDocumentStatus.Confirmed.ToString(),
                    CreatedAt = DateTime.UtcNow
                });
            }

            foreach (var item in groupedItems)
            {
                var lot = await _lotService.GetByIdAsync(item.LotId);
                if (lot == null)
                {
                    if (string.IsNullOrWhiteSpace(item.LotName))
                        throw new ArgumentException($"Không tìm thấy lô {item.LotId} và LotName là bắt buộc để tạo mới lô");

                    if (item.ExpirationDate == default)
                        throw new ArgumentException("Ngày hết hạn là bắt buộc khi tạo mới lô");

                    var newLot = await _lotService.CreateProductLot(new ProductLot
                    {
                        ProductId = item.ProductId,
                        LotNumber = item.LotName,
                        ExpirationDate = item.ExpirationDate,
                    });

                    item.LotId = newLot.Id;
                }

                var product = await _productService.GetByIdAsync(item.ProductId);
                if (product == null) throw new ArgumentException($"Product {item.ProductId} not found");

                var poItem = await _purchaseOrderItemService.GetByPurchaseOrderIdAndProductIdAndLotId(po.Id, item.ProductId, item.LotId);
                if (poItem == null)
                {
                    poItem = await _purchaseOrderItemService.CreatePurchaseOrderItem(new PurchaseOrderItem
                    {
                        PurchaseOrderId = po.Id,
                        ProductId = item.ProductId,
                        LotId = item.LotId,
                        OrderedQty = item.Quantity,
                        ReceivedQty = 0,
                        UnitPrice = product.StockPrice,
                        Subtotal = product.StockPrice * item.Quantity
                    });
                }
                else
                {
                    poItem.OrderedQty = item.Quantity;
                    poItem.Subtotal = poItem.UnitPrice * poItem.OrderedQty;
                    await _purchaseOrderItemService.UpdatePurchaseOrderItem(poItem);
                }

                var inventory = await _currentInventoryService.GetCurrentInventoryByLotIdAndProductIdAndLocationId(
                    item.ProductId, item.LotId, (int)input.ToLocationId);
                var reservedQty = inventory?.ReservedQuantity ?? 0;

                var transactions = await _stockTransactionService.GetByDocumentId(doc.Id);
                var existingTran = transactions.FirstOrDefault(t =>
                    t.ProductId == item.ProductId &&
                    t.LotId == item.LotId &&
                    t.Status == StockTransactionStatus.Draft.ToString());

                if (existingTran != null)
                {
                    existingTran.PlannedQty = item.Quantity;
                    existingTran.ReservedQty = existingTran.ReservedQty ?? 0;
                    existingTran.Status = StockTransactionStatus.Confirmed.ToString();
                    existingTran.PlannedDate = input.PlannedDate;
                    await _stockTransactionService.UpdateStockTransaction(existingTran);
                }
                else
                {
                    await _stockTransactionService.CreateStockTransactionPurchase(new StockTransaction
                    {
                        DocumentId = doc.Id,
                        ProductId = item.ProductId,
                        LotId = item.LotId,
                        PlannedQty = item.Quantity,
                        ActualQty = 0,
                        UomId = product.PurchaseUomId,
                        FromLocationId = input.SupplierId,
                        ToLocationId = input.ToLocationId,
                        ReservedQty = reservedQty,
                        TransactionType = StockTransactionType.Receipt.ToString(),
                        Status = StockTransactionStatus.Confirmed.ToString(),
                        PlannedDate = input.PlannedDate,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            po.Status = PurchaseOrderStatus.Confirmed.ToString();
            doc.Status = StockDocumentStatus.Confirmed.ToString();

            await _purchaseOrderService.UpdatePurchaseOrder(po);
            await _stockDocumentService.UpdateStockDocument(doc);

            return input;
        }


        public async Task<HashSet<int>> GetAuthorizedLocationIdsAsync(int effectiveId)
        {
            var warehouses = await _warehouseService.GetWarehousesByManagerIdAsync(effectiveId);
            if (warehouses == null || !warehouses.Any()) return new HashSet<int>();

            var locationIds = new HashSet<int>();
            foreach (var w in warehouses)
            {
                var locations = await _locationService.GetLocationByWarehouseIdAsync(w.Id);
                if (locations != null)
                {
                    foreach (var l in locations)
                    {
                        locationIds.Add(l.Id);
                    }
                }
            }
            return locationIds;
        }

        public async Task DeleteDraftPurchaseOrderItemAsync(int itemId, int userId)
        {
            if (itemId <= 0) throw new ArgumentException("ItemId must be greater than zero.");

            var item = await _purchaseOrderItemService.GetByIdAsync(itemId);
            if (item == null) throw new KeyNotFoundException($"PurchaseOrderItem {itemId} not found");

            var po = await _purchaseOrderService.GetByIdAsync(item.PurchaseOrderId ?? 0);
            if (po == null) throw new KeyNotFoundException($"PurchaseOrder {item.PurchaseOrderId} not found");

            if (po.Status != PurchaseOrderStatus.Draft.ToString())
                throw new InvalidOperationException("Chỉ có thể xóa dòng sản phẩm khi đơn hàng ở trạng thái Nháp (Draft)");

            // Find the StockDocument related to this PO
            var documents = await _stockDocumentService.GetAllAsync();
            var doc = documents.FirstOrDefault(d =>
                d.ReferenceId == po.Id &&
                d.ReferenceType == "PurchaseOrder" &&
                d.Status == StockDocumentStatus.Draft.ToString());

            if (doc != null)
            {
                // Find all draft transactions for this document and product/lot
                var transactions = await _stockTransactionService.GetByDocumentId(doc.Id);
                var relatedTransactions = transactions.Where(t =>
                    t.ProductId == item.ProductId &&
                    t.LotId == item.LotId &&
                    t.Status == StockTransactionStatus.Draft.ToString());

                foreach (var tx in relatedTransactions)
                {
                    await _stockTransactionService.DeleteAsync(tx.Id);
                }
            }

            // Keep LotId for cleanup check
            int? lotId = item.LotId;

            // Delete the PurchaseOrderItem
            await _purchaseOrderItemService.DeleteAsync(item);

            // Cleanup Lot if unused
            if (lotId.HasValue)
            {
                var isUsed = await _lotService.IsLotReferencedAsync(lotId.Value);
                if (!isUsed)
                {
                    await _lotService.DeleteAsync(lotId.Value);
                }
            }
        }

        public async Task CancelPurchaseOrderAsync(int id, int userId)
        {
            var po = await _unitOfWork.PurchaseOrder.GetByIdAsync(id);
            if (po == null) throw new KeyNotFoundException($"PurchaseOrder {id} not found.");

            if (po.Status == PurchaseOrderStatus.Completed.ToString() || po.Status == PurchaseOrderStatus.PartiallyReceived.ToString())
            {
                throw new InvalidOperationException("Cannot cancel a completed or partially received purchase order.");
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var stockDoc = await _unitOfWork.StockDocument.GetStockDocumentByReferenceId(id);

                if (po.Status == PurchaseOrderStatus.Draft.ToString())
                {
                    // Hard delete for Draft
                    if (stockDoc != null)
                    {
                        var transactions = await _unitOfWork.StockTransaction.GetByDocumentIdAsync(stockDoc.Id);
                        foreach (var trans in transactions)
                        {
                            await _unitOfWork.StockTransaction.DeleteAsync(trans);
                        }
                        await _unitOfWork.StockDocument.DeleteAsync(stockDoc);
                    }

                    var items = po.PurchaseOrderItems.ToList();
                    foreach (var item in items)
                    {
                        if (item.LotId.HasValue)
                        {
                            var lotId = item.LotId.Value;
                            await _unitOfWork.PurchaseOrderItem.DeleteAsync(item);
                            // Cleanup lot if not used elsewhere
                            var isLotUsed = await _unitOfWork.ProductLot.IsLotReferencedAsync(lotId);
                            if (!isLotUsed)
                            {
                                var lot = await _unitOfWork.ProductLot.GetByIdAsync(lotId);
                                if (lot != null)
                                {
                                    await _unitOfWork.ProductLot.DeleteAsync(lot);
                                }
                            }
                        }
                        else
                        {
                            await _unitOfWork.PurchaseOrderItem.DeleteAsync(item);
                        }
                    }




                    await _unitOfWork.PurchaseOrder.DeleteAsync(po);
                }
                else if (po.Status == PurchaseOrderStatus.Confirmed.ToString() || po.Status == PurchaseOrderStatus.Pending.ToString())
                {
                    // Cancel for Confirmed/Pending
                    po.Status = PurchaseOrderStatus.Cancelled.ToString();
                    po.CompletedAt = null; // Ensure it's not set
                    await _unitOfWork.PurchaseOrder.UpdatePurchaseOrder(po);

                    if (stockDoc != null)
                    {
                        stockDoc.Status = StockDocumentStatus.Cancelled.ToString();
                        stockDoc.CompletedAt = null; // Ensure it's not set
                        await _unitOfWork.StockDocument.UpdateStockDocument(stockDoc);

                        var transactions = await _unitOfWork.StockTransaction.GetByDocumentIdAsync(stockDoc.Id);
                        foreach (var trans in transactions)
                        {
                            trans.Status = StockTransactionStatus.Cancelled.ToString();
                            trans.CompletedAt = null; // Ensure it's not set
                            await _unitOfWork.StockTransaction.UpdateAsync(trans);
                        }
                    }
                }
                else
                {
                    throw new InvalidOperationException($"Cannot cancel purchase order with status {po.Status}.");
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}


