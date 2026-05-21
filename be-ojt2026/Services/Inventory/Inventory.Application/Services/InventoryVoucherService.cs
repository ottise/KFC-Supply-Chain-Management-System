using Inventory.Application.DTOs;
using Inventory.Application.DTOs.InventoryAdjustment;
using Inventory.Application.IServices;
using Inventory.Application.Services;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using System.Linq;

namespace Inventory.Application.Services
{
    public class InventoryVoucherService : IInventoryVoucherService
    {
        private readonly ICurrentInventoryService _currentInventoryService;
        private readonly IInventoryAdjustmentService _adjustmentService;
        private readonly IInventoryAdjustmentItemService _adjustmentItemService;
        private readonly IStockDocumentService _stockDocumentService;
        private readonly IStockTransactionService _stockTransactionService;
        private readonly IProductService _productService;
        private readonly IWarehouseService _warehouse;
        private readonly ILocationService _locationService;

        public InventoryVoucherService(
            ICurrentInventoryService currentInventoryService,
            IInventoryAdjustmentService adjustmentService,
            IInventoryAdjustmentItemService adjustmentItemService,
            IStockDocumentService stockDocumentService,
            IStockTransactionService stockTransactionService,
            IProductService productService,
            IWarehouseService warehouse,
            ILocationService locationService)
        {
            _currentInventoryService = currentInventoryService;
            _adjustmentService = adjustmentService;
            _adjustmentItemService = adjustmentItemService;
            _stockDocumentService = stockDocumentService;
            _stockTransactionService = stockTransactionService;
            _productService = productService;
            _warehouse = warehouse;
            _locationService = locationService;
        }

        public async Task<List<Location>> GetLocationsByManagerId(int? managerId, int? userId, int? warehouseId = null)
        {
            int id;

            if (managerId.HasValue && managerId.Value > 0)
            {
                id = managerId.Value;
            }
            else if (userId.HasValue && userId.Value > 0)
            {
                id = userId.Value;
            }
            else
            {
                throw new ArgumentException("Phải có managerId hoặc userId hợp lệ");
            }


            List<Warehouse> warehouses;

            if (managerId.HasValue && managerId.Value > 0)
            {
                warehouses = await _warehouse.GetWarehousesByManagerIdAsync(managerId.Value);
                if (warehouses == null || !warehouses.Any())
                    throw new KeyNotFoundException($"Không tìm thấy kho nào cho manager {managerId}");
            }
            else
            {
                warehouses = await _warehouse.GetWarehousesByManagerIdAsync(userId.Value);
                if (warehouses == null || !warehouses.Any())
                    throw new KeyNotFoundException($"Không tìm thấy kho nào cho user {userId}");
            }

            if (warehouseId.HasValue)
            {
                var warehouse = warehouses.FirstOrDefault(w => w.Id == warehouseId.Value)
                                ?? throw new KeyNotFoundException($"Manager/User không quản lý kho {warehouseId}");
                var locations = await _locationService.GetLocationByWarehouseIdAsync(warehouse.Id);
                if (locations == null || !locations.Any())
                    throw new KeyNotFoundException($"Kho {warehouse.Id} không có vị trí nào");
                return locations.ToList();
            }
            else
            {
                var allLocations = new List<Location>();
                foreach (var wh in warehouses)
                {
                    var locs = await _locationService.GetLocationByWarehouseIdAsync(wh.Id);
                    if (locs != null && locs.Any())
                        allLocations.AddRange(locs);
                }

                if (!allLocations.Any())
                    throw new KeyNotFoundException("Không tìm thấy vị trí nào trong các kho manager quản lý");

                return allLocations;
            }
        }
        public async Task<List<StaffWorkResponseDto>> GetStaffWorkAsync(
        int staffId, int? lotId = null, int? locationId = null, int? warehouseId = null)
        {
            if (staffId <= 0)
                throw new ArgumentException("StaffId không hợp lệ");

            var adjustments = await _adjustmentService.GetInventoryAdjustmentByAssigneeIdAsync(staffId);
            if (adjustments == null || !adjustments.Any())
                throw new KeyNotFoundException($"Không tìm thấy phiếu kiểm kê nào cho staff {staffId}");

            adjustments = adjustments.Where(a => a.Status == "Draft").ToList();

            var responseList = new List<StaffWorkResponseDto>();

            foreach (var adj in adjustments)
            {
                var adjItems = await _adjustmentItemService.GetItemsByAdjustmentId(adj.Id);

                // Hiển thị tất cả item trừ item đã Complete
                // adjItems = adjItems.Where(i => i.CountedQty == null || i.CountedQty == 0).ToList();

                if (lotId.HasValue)
                    adjItems = adjItems.Where(i => i.LotId == lotId.Value).ToList();

                if (locationId.HasValue)
                    adjItems = adjItems.Where(i => i.LocationId == locationId.Value).ToList();

                if (warehouseId.HasValue)
                {
                    var locs = await _locationService.GetLocationByWarehouseIdAsync(warehouseId.Value);
                    var locIds = locs.Select(l => l.Id).ToHashSet();
                    adjItems = adjItems.Where(i => locIds.Contains(i.LocationId ?? 0)).ToList();
                }

                if (!adjItems.Any()) continue;

                foreach (var item in adjItems)
                {
                    var transactions = await _stockTransactionService.GetByProductLocationLotAllAsync(
                        item.ProductId ?? 0, item.LocationId ?? 0, item.LotId);

                    if (transactions == null || !transactions.Any()) continue;

                    // Chỉ lấy transaction thuộc nghiệp vụ kiểm kê để tránh lấy nhầm
                    // transaction của xuất/nhập/điều chuyển khi cùng product/location/lot.
                    var adjustmentTransactions = transactions
                        .Where(t => string.Equals(t.TransactionType, "Adjustment", StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    if (!adjustmentTransactions.Any()) continue;

                    var currentInv = await _currentInventoryService.GetCurrentInventoryByLotIdAndProductIdAndLocationId(
                        item.ProductId ?? 0, item.LotId ?? 0, item.LocationId ?? 0);             
                    var latestTran = adjustmentTransactions.OrderByDescending(t => t.CreatedAt).FirstOrDefault();

                    var liveSystemQty = currentInv?.Quantity ?? item.SystemQty ?? 0;

                    responseList.Add(new StaffWorkResponseDto
                    {
                        InventoryId = currentInv?.Id ?? 0,
                        WarehouseId = (await _warehouse.GetWarehouseByLocationIdAsync(item.LocationId ?? 0))?.Id ?? 0,
                        AssigneeId = adj.AssigneeId,
                        ProductId = item.ProductId ?? 0,
                        LocationId = item.LocationId ?? 0,
                        LotId = item.LotId,
                        TranId = latestTran?.Id ?? 0,
                        PlanDate = latestTran?.PlannedDate,
                        SystemQty = liveSystemQty,
                        CountQty = item.CountedQty,
                        DifferenceQty = item.CountedQty.HasValue
                            ? item.CountedQty.Value - liveSystemQty
                            : item.DifferenceQty,
                        Status = adj.Status
                    });
                }
            }

            return responseList;
        }


        public async Task<StaffWorkResponseDto> UpdateCountAsync(UpdateCountRequestDto request, int staffId)
        {
            if (staffId <= 0)
                throw new ArgumentException("StaffId không hợp lệ");

            var tx = await _stockTransactionService.GetTransactionById(request.TranId)
                     ?? throw new KeyNotFoundException($"Không tìm thấy StockTransaction {request.TranId}");

            var document = await _stockDocumentService.GetStockDocumentById(tx.DocumentId ?? 0)
                           ?? throw new KeyNotFoundException($"Không tìm thấy Document {tx.DocumentId}");

            var adjustment = await _adjustmentService.GetById(document.ReferenceId ?? 0)
                             ?? throw new KeyNotFoundException($"Không tìm thấy Adjustment {document.ReferenceId}");

            var adjItems = await _adjustmentItemService.GetItemsByAdjustmentId(adjustment.Id);
            var adjItem = adjItems.FirstOrDefault(i =>
                i.LocationId == tx.FromLocationId &&
                i.ProductId == tx.ProductId &&
                i.LotId == tx.LotId)
                ?? throw new KeyNotFoundException($"Không tìm thấy AdjustmentItem cho Transaction {request.TranId}");

            if (adjustment.AssigneeId != staffId)
                throw new InvalidOperationException("Staff không được gán cho Adjustment này");

            if (adjustment.Status != "Draft")
                throw new InvalidOperationException("Chỉ được update khi Adjustment đang ở trạng thái Draft");

            // Cho phép Staff cập nhật lại số lượng đếm khi ở trạng thái Draft
            // if (adjItem.CountedQty != null && adjItem.CountedQty > 0)
            //     throw new InvalidOperationException("AdjustmentItem đã có số lượng đếm, không thể update lại");

            var currentInvForCount = await _currentInventoryService.GetCurrentInventoryByLotIdAndProductIdAndLocationId(
                adjItem.ProductId ?? 0, adjItem.LotId ?? 0, adjItem.LocationId ?? 0);
            var liveSystemQty = currentInvForCount?.Quantity ?? adjItem.SystemQty ?? 0;

            await _adjustmentItemService.UpdateCount(adjItem.Id, request.CountQty, liveSystemQty);

            tx.ActualQty = request.CountQty;
            tx.Status = StockTransactionStatus.Draft.ToString();
            tx.CompletedAt = null;
            await _stockTransactionService.UpdateStockTransaction(tx);

            adjustment.Status = "Draft";
            adjustment.CompletedAt = null;
            await _adjustmentService.UpdateAdjustment(adjustment);

            document.Status = "Draft";
            document.CompletedAt = null;
            await _stockDocumentService.UpdateStockDocument(document);

            return new StaffWorkResponseDto
            {
                InventoryId = adjustment.Id, 
                WarehouseId = document.FromLocationId ?? 0, 
                AssigneeId = adjustment.AssigneeId,
                ProductId = tx.ProductId ?? 0,
                LocationId = tx.FromLocationId ?? 0,
                LotId = tx.LotId,
                TranId = tx.Id,
                PlanDate = tx.PlannedDate,
                SystemQty = liveSystemQty,
                CountQty = request.CountQty,
                DifferenceQty = request.CountQty - liveSystemQty,
                Status = tx.Status
            };
        }



        public async Task<List<ManagerWorkResponseDto>> GetManagerInventoriesAsync(int? managerId, int userId, int? lotId = null, int? locationId = null,int? warehouseId = null, string? status = null)
        {
            var effectiveManagerId = (managerId.HasValue && managerId.Value > 0) ? managerId.Value : userId;
            if (effectiveManagerId <= 0)
                throw new ArgumentException("Không xác định được manager hợp lệ");

            var warehouses = await _warehouse.GetWarehousesByManagerIdAsync(effectiveManagerId);
            if (warehouses == null || !warehouses.Any())
                throw new KeyNotFoundException($"Không tìm thấy kho nào cho manager/user {effectiveManagerId}");

            if (warehouseId.HasValue)
            {
                warehouses = warehouses.Where(w => w.Id == warehouseId.Value).ToList();
                if (!warehouses.Any())
                    throw new InvalidOperationException($"User {userId} không quản lý warehouse {warehouseId}");
            }

            var allLocations = new List<Location>();
            foreach (var wh in warehouses)
            {
                var locs = await _locationService.GetLocationByWarehouseIdAsync(wh.Id);
                if (locs != null && locs.Any())
                    allLocations.AddRange(locs);
            }
            if (!allLocations.Any())
                throw new KeyNotFoundException("Không tìm thấy vị trí nào trong các kho user quản lý");

            var locationWarehouseMap = allLocations.ToDictionary(l => l.Id, l => l.WarehouseId);

            var locationIds = allLocations.Select(l => l.Id).ToList();
            var inventories = await _currentInventoryService.GetCurrentInventoriesByLocationIds(locationIds);
            if (inventories == null || !inventories.Any())
                throw new KeyNotFoundException("Không tìm thấy inventory nào");

            var responseList = new List<ManagerWorkResponseDto>();

            foreach (var inv in inventories)
            {
                if (lotId.HasValue && inv.LotId != lotId.Value) continue;
                if (locationId.HasValue && inv.LocationId != locationId.Value) continue;

                var adjustments = await _adjustmentService.GetAdjustmentsByLocation(inv.LocationId ?? 0);

                InventoryAdjustment? adj = null;
                InventoryAdjustmentItem? adjItem = null;
                StockTransaction? latestTran = null;

                foreach (var a in adjustments)
                {
                    var items = await _adjustmentItemService.GetItemsByAdjustmentId(a.Id);
                    var adjItemMatch = items.FirstOrDefault(i => i.ProductId == inv.ProductId && i.LotId == inv.LotId);

                    if (adjItemMatch != null)
                    {
                        adj = a;
                        adjItem = adjItemMatch;

                        var trans = await _stockTransactionService.GetByProductLocationLotAllAsync(
    adjItem.ProductId ?? 0, adjItem.LocationId ?? 0, adjItem.LotId);

                        var newest = trans?
                            .Where(t => string.Equals(t.TransactionType, "Adjustment", StringComparison.OrdinalIgnoreCase))
                            .OrderByDescending(t => t.CreatedAt)
                            .FirstOrDefault();
                        if (newest != null) latestTran = newest;
                    }
                }

                if (!string.IsNullOrEmpty(status))
                {
                    if (adj == null || !string.Equals(adj.Status, status, StringComparison.OrdinalIgnoreCase))
                        continue;
                }

                var dto = new ManagerWorkResponseDto
                {
                    InventoryId = inv.Id,
                    WarehouseId = (int)(locationWarehouseMap.ContainsKey(inv.LocationId ?? 0)
                                  ? locationWarehouseMap[inv.LocationId ?? 0]
                                  : 0),
                    AssigneeId = adj?.AssigneeId,
                    ProductId = inv.ProductId ?? 0,
                    LocationId = inv.LocationId ?? 0,
                    LotId = inv.LotId,
                    TranId = latestTran?.Id ?? 0,
                    PlanDate = latestTran?.PlannedDate,
                    SystemQty = inv.Quantity ?? 0,
                    ReservedQty = inv.ReservedQuantity ?? 0,
                    CountQty = adjItem?.CountedQty,
                    DifferenceQty = adjItem?.DifferenceQty,
                    Status = latestTran?.Status, 
                    CreateAt = latestTran?.CreatedAt ?? DateTime.MinValue,
                    CompleteAt = latestTran?.CompletedAt
                };

                if (dto.Status == "Completed" || dto.TranId == 0)
                {
                    dto.CountQty = 0;
                    dto.DifferenceQty = 0;
                    dto.AssigneeId = null;
                }


                responseList.Add(dto);
            }

            var distinctResponse = responseList
                .GroupBy(r => r.InventoryId)
                .Select(g => g.OrderByDescending(x => x.CreateAt).First())
                .ToList();

            return distinctResponse;
        }
        public async Task<CreateDraftResponseDto> CreateDraftAsync(CreateDraftRequestDto request, int? managerId, int userId)
        {
            var effectiveManagerId = (managerId.HasValue && managerId.Value > 0) ? managerId.Value : userId;
            if (effectiveManagerId <= 0)
                throw new ArgumentException("Không xác định được manager hợp lệ");

            if (request == null || request.InventoryId <= 0 || request.AssigneeId <= 0)
                throw new ArgumentException("Thông tin request không hợp lệ");

            if (request.PlanDate <= DateTime.UtcNow)
                throw new ArgumentException("PlanDate phải là ngày trong tương lai");

            var currentInv = await _currentInventoryService.GetCurrentInventoryById(request.InventoryId)
                             ?? throw new KeyNotFoundException($"Không tìm thấy Inventory {request.InventoryId}");

            var warehouse = await _warehouse.GetWarehouseByLocationIdAsync(currentInv.LocationId ?? 0)
                           ?? throw new KeyNotFoundException($"Không tìm thấy warehouse cho location {currentInv.LocationId}");

            var warehouses = await _warehouse.GetWarehousesByManagerIdAsync(effectiveManagerId);
            if (!warehouses.Any(w => w.Id == warehouse.Id))
                throw new InvalidOperationException($"User {effectiveManagerId} không quản lý warehouse {warehouse.Id}");

            var locs = await _locationService.GetLocationByWarehouseIdAsync(warehouse.Id);
            if (locs == null || !locs.Any(l => l.Id == currentInv.LocationId))
                throw new InvalidOperationException($"User {effectiveManagerId} không quản lý location {currentInv.LocationId}");

            var adjustments = await _adjustmentService.GetAdjustmentsByLocation(currentInv.LocationId ?? 0);
            foreach (var adj in adjustments.Where(a => a.Status == "Draft"))
            {
                var items = await _adjustmentItemService.GetItemsByAdjustmentId(adj.Id);
                var existingItem = items.FirstOrDefault(i =>
                    i.ProductId == currentInv.ProductId && i.LotId == currentInv.LotId);

                if (existingItem != null)
                    throw new InvalidOperationException("Inventory này đang kiểm kê (Draft chưa hoàn thành), không thể tạo thêm draft mới");
            }

            var adjustment = await _adjustmentService.CreateAdjustment()
                             ?? throw new InvalidOperationException("Không thể tạo Adjustment");
            adjustment.Status = "Draft";
            adjustment.AssigneeId = request.AssigneeId;

            var stockDocDto = new CreateStockDocumentDto
            {
                FromLocationId = currentInv.LocationId ?? 0,
                ToLocationId = currentInv.LocationId ?? 0,
                ReferenceId = adjustment.Id,
                DocumentType = StockDocumentType.Adjustment.ToString(),
            };
            var stockDoc = await _stockDocumentService.CreateStockDocument(stockDocDto)
                           ?? throw new InvalidOperationException("Không thể tạo StockDocument");

            var adjItem = new InventoryAdjustmentItem
            {
                AdjustmentId = adjustment.Id,
                ProductId = currentInv.ProductId ?? 0,
                LocationId = currentInv.LocationId ?? 0,
                LotId = currentInv.LotId,
                SystemQty = currentInv.Quantity,
                CountedQty = null,
                DifferenceQty = null
            };
            await _adjustmentItemService.CreateAdjustmentItem(adjItem);

            var product = await _productService.GetByIdAsync(currentInv.ProductId ?? 0)
                          ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm {currentInv.ProductId}");

            var stockTran = new StockTransaction
            {
                DocumentId = stockDoc.Id,
                ProductId = adjItem.ProductId,
                UomId = product.BaseUomId,
                FromLocationId = currentInv.LocationId ?? 0,
                ToLocationId = currentInv.LocationId ?? 0,
                PlannedQty = adjItem.SystemQty ?? 0,
                ActualQty = 0,
                ReservedQty = currentInv.ReservedQuantity ?? 0,
                LotId = adjItem.LotId,
                TransactionType = StockTransactionType.Adjustment.ToString(),
                Status = StockTransactionStatus.Draft.ToString(),
                CreatedAt = DateTime.UtcNow,
                PlannedDate = request.PlanDate
            };
            var createdTran = await _stockTransactionService.CreateStockTransaction(stockTran);

            return new CreateDraftResponseDto
            {
                InventoryId = currentInv.Id,
                WarehouseId = warehouse.Id,
                AssigneeId = request.AssigneeId,
                ProductId = currentInv.ProductId ?? 0,
                LocationId = currentInv.LocationId ?? 0,
                LotId = currentInv.LotId,
                TranId = createdTran.Id,
                PlanDate = request.PlanDate,
                SystemQty = currentInv.Quantity ?? 0,
                CountQty = null,
                DifferenceQty = null,
                Status = adjustment.Status
            };
        }


        public async Task<List<CompleteResponseDto>> CompleteAsync(List<CompleteRequestDto> requests, int? managerId, int userId)
        {
            // Cho phép cả Manager và Staff đã được gán (Assignee) thực hiện hoàn tất
            // Bỏ qua check managerId bắt buộc nếu người dùng là Staff được gán việc
            // if (managerId == null || managerId <= 0)
            //     throw new ArgumentException("Chỉ manager mới được phép hoàn tất phiếu kiểm kê");


            if (requests == null || !requests.Any())
                throw new ArgumentException("Danh sách request không hợp lệ");

            var responseList = new List<CompleteResponseDto>();

            foreach (var req in requests)
            {
                if (req == null)
                    throw new ArgumentException("Một trong các yêu cầu được gửi lên bị null.");

                if (req.TranId <= 0)
                    throw new ArgumentException($"TranId (Mã giao dịch) không hợp lệ: {req.TranId}. Đảm bảo bạn đang gửi danh sách các đối tượng có thuộc tính TranId.");

                var tx = await _stockTransactionService.GetTransactionById(req.TranId)
                         ?? throw new KeyNotFoundException($"Không tìm thấy StockTransaction với ID {req.TranId} trong hệ thống.");

                var document = await _stockDocumentService.GetStockDocumentById(tx.DocumentId ?? 0)
                               ?? throw new KeyNotFoundException($"Không tìm thấy StockDocument liên quan đến Transaction {req.TranId} (DocumentId: {tx.DocumentId}).");

        
                var adjustment = await _adjustmentService.GetById(document.ReferenceId ?? 0)
                                 ?? throw new KeyNotFoundException($"Không tìm thấy InventoryAdjustment liên quan đến Document {document.Id} (ReferenceId: {document.ReferenceId}).");

                if (adjustment.Status != "Draft" && adjustment.Status != "Completed")
                    throw new InvalidOperationException($"Chỉ có thể hoàn tất Adjustment đang ở trạng thái Draft. Trạng thái hiện tại của phiếu #{adjustment.Id} là: {adjustment.Status}");

                if (adjustment.Status == "Completed")
                {
                    // Tiếp tục nếu đây là item tiếp theo của cùng một phiếu đã được chốt ở item trước
                }

                var adjItems = await _adjustmentItemService.GetItemsByAdjustmentId(adjustment.Id);
                var item = adjItems.FirstOrDefault(i =>
                    i.ProductId == tx.ProductId && i.LotId == tx.LotId && i.LocationId == tx.FromLocationId)
                    ?? throw new KeyNotFoundException($"Không tìm thấy AdjustmentItem khớp với Transaction {req.TranId} trong phiếu #{adjustment.Id}.");

              
                var warehouse = await _warehouse.GetWarehouseByLocationIdAsync(item.LocationId ?? 0)
                               ?? throw new KeyNotFoundException($"Không tìm thấy kho (Warehouse) cho vị trí ID {item.LocationId}.");

                // Kiểm tra xem người dùng có quyền hoàn tất không:
                // Ưu tiên kiểm tra xem có phải là Người được gán (Assignee) không trước khi gọi service manager
                bool isAssignee = adjustment.AssigneeId == userId;
                bool isManager = false;

                if (!isAssignee)
                {
                    try
                    {
                        var warehouses = await _warehouse.GetWarehousesByManagerIdAsync(userId);
                        isManager = warehouses != null && warehouses.Any(w => w.Id == warehouse.Id);
                    }
                    catch
                    {
                        // Nếu userId không phải là manager, service có thể ném ngoại lệ. 
                        // Chúng ta coi như isManager = false và tiếp tục kiểm tra quyền.
                        isManager = false;
                    }
                }

                if (!isManager && !isAssignee)
                {
                    throw new InvalidOperationException($"User ID {userId} không có quyền hoàn tất phiếu kiểm kê này. Bạn không phải là người được gán thực hiện phiếu này (AssigneeId: {adjustment.AssigneeId}) và cũng không phải là Manager quản lý kho {warehouse.Name}.");
                }


                var currentInv = await _currentInventoryService.GetCurrentInventoryByLotIdAndProductIdAndLocationId(
                    item.ProductId ?? 0, item.LotId ?? 0, item.LocationId ?? 0);

                if (currentInv == null)
                    throw new KeyNotFoundException($"Không tìm thấy bản ghi tồn kho tương ứng (CurrentInventory) cho mặt hàng trong Transaction {req.TranId}.");

        
                var finalQty = (req.FinalCountQty == null || req.FinalCountQty < 0)
                    ? (item.CountedQty ?? 0)
                    : req.FinalCountQty.Value;

                var liveSystemQty = currentInv.Quantity ?? item.SystemQty ?? 0;
                await _adjustmentItemService.UpdateCount(item.Id, finalQty, liveSystemQty);

                tx.ActualQty = finalQty;
                tx.Status = StockTransactionStatus.Completed.ToString();
                tx.CompletedAt = DateTime.UtcNow;
                await _stockTransactionService.UpdateStockTransaction(tx);

                await _currentInventoryService.UpdateQuantity(currentInv.Id, finalQty);

                if (adjustment.Status != "Completed")
                {
                    adjustment.Status = "Completed";
                    adjustment.CompletedAt = DateTime.UtcNow;
                    await _adjustmentService.UpdateAdjustment(adjustment);

                    document.Status = StockDocumentStatus.Completed.ToString();
                    document.CompletedAt = DateTime.UtcNow;
                    await _stockDocumentService.UpdateStockDocument(document);
                }

                responseList.Add(new CompleteResponseDto
                {
                    InventoryId = currentInv.Id,
                    WarehouseId = warehouse.Id,
                    AssigneeId = null,
                    ProductId = item.ProductId ?? 0,
                    LocationId = item.LocationId ?? 0,
                    LotId = item.LotId,
                    TranId = tx.Id,
                    PlanDate = tx.PlannedDate ?? DateTime.UtcNow,
                    SystemQty = liveSystemQty,
                    CountQty = finalQty,
                    DifferenceQty = finalQty - liveSystemQty,
                    Status = "Completed",
                    CompletedAt = DateTime.UtcNow
                });
            }

            return responseList;
        }


    }
}