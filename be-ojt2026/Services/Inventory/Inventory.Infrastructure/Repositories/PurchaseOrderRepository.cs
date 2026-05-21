using System.Globalization;
using System.Linq;
using System.Text;
using BuildingBlocks.Utils;
using Inventory.Application.DTOs.PurchaseOrder;
using Inventory.Application.IRepositories;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;


namespace Inventory.Infrastructure.Repositories
{
    public class PurchaseOrderRepository : IPurchaseOrderRepository
    {
        private readonly InventoryDbContext _context;

        public PurchaseOrderRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PurchaseOrder>> GetAllAsync()
        {
            return await _context.PurchaseOrders
                .Include(p => p.PurchaseOrderItems)
                .ToListAsync();
        }

        public async Task<PurchaseOrder?> GetByIdAsync(int id)
        {
            return await _context.PurchaseOrders
                .Include(p => p.PurchaseOrderItems)
                .SingleOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<PurchaseOrder>> GetBySupplierIdAsync(int supplierId)
        {
            return await _context.PurchaseOrders
                .Where(p => p.SupplierId == supplierId)
                .ToListAsync();
        }

        public async Task<List<PurchaseOrder>> GetByStatusAsync(string status)
        {
            return await _context.PurchaseOrders
                .Where(p => p.Status == status)
                .ToListAsync();
        }

        public async Task<List<PurchaseOrder>> GetByCreatedAtAsync(DateTime createdAt)
        {
            return await _context.PurchaseOrders
                .Where(p => p.CreatedAt.HasValue && p.CreatedAt.Value.Date == createdAt.Date)
                .ToListAsync();
        }

        public async Task<List<PurchaseOrder>> GetByConfirmedAtAsync(DateTime confirmedAt)
        {
            return await _context.PurchaseOrders
                .Where(p => p.ConfirmedAt.HasValue && p.ConfirmedAt.Value.Date == confirmedAt.Date)
                .ToListAsync();
        }

        public async Task<List<PurchaseOrder>> GetByCompletedAtAsync(DateTime completedAt)
        {
            return await _context.PurchaseOrders
                .Where(p => p.CompletedAt.HasValue && p.CompletedAt.Value.Date == completedAt.Date)
                .ToListAsync();
        }

        public async Task UpdateSupplierAsync(int id, int supplierId)
        {
            var order = await GetByIdAsync(id);
            if (order == null)
                throw new Exception($"PurchaseOrder with id {id} not found.");

            order.SupplierId = supplierId;
            _context.PurchaseOrders.Update(order);
        }

        public async Task UpdateStatusAsync(int id, string status)
        {
            var order = await GetByIdAsync(id);
            if (order == null)
                throw new Exception($"PurchaseOrder with id {id} not found.");

            order.Status = status;
            var now = DateTime.UtcNow;

            if (status == PurchaseOrderStatus.Confirmed.ToString())
                order.ConfirmedAt = now;
            else if (status == PurchaseOrderStatus.Completed.ToString())
                order.CompletedAt = now;

            _context.PurchaseOrders.Update(order);
        }
        public async Task AddAsync(CreatePurchaseOrderDto order)
        {
            string status = (order.ReceivedQty == order.OrderedQty) ? PurchaseOrderStatus.Pending.ToString() : PurchaseOrderStatus.PartiallyReceived.ToString();

            var newOrder = new PurchaseOrder
            {
                SupplierId = order.SupplierId,
                Status = status,
                CreatedAt = DateTime.UtcNow,
                PurchaseOrderItems = new List<PurchaseOrderItem>
                {
                    new PurchaseOrderItem
                    {
                        ProductId = order.ProductId,
                        OrderedQty = order.OrderedQty,
                        ReceivedQty = order.ReceivedQty,
                        UnitPrice = order.UnitPrice,
                        Subtotal = order.UnitPrice * order.OrderedQty
                    }
                }
            };

            await _context.PurchaseOrders.AddAsync(newOrder);
        }
        public async Task<PurchaseOrder> CreatePurchaseOrder(PurchaseOrder order)
        {
            await _context.PurchaseOrders.AddAsync(order);
            return order;
        }
        public async Task UpdatePurchaseOrder(PurchaseOrder po)
        {
            _context.PurchaseOrders.Update(po);
            await Task.CompletedTask;
        }

        public async Task<(List<PurchaseOrderResponseDto> Items, int TotalCount)> SearchAsync(PurchaseOrderSearchDto searchDto)
        {
            var query = from po in _context.PurchaseOrders
                            .Include(p => p.Supplier)
                            .Include(p => p.ToLocation)
                        join sd in _context.StockDocuments
                            on new { RefId = (int?)po.Id, RefType = "PurchaseOrder" }
                            equals new { RefId = sd.ReferenceId, RefType = sd.ReferenceType } into sdGroup
                        from sd in sdGroup.DefaultIfEmpty()
                        select new { po, sd };

            // Lọc theo trạng thái
            if (!string.IsNullOrWhiteSpace(searchDto.Status))
                query = query.Where(x => x.po.Status == searchDto.Status);

            // Lọc theo khoảng ngày tạo
            if (searchDto.FromDate.HasValue)
                query = query.Where(x => x.po.CreatedAt >= searchDto.FromDate);

            if (searchDto.ToDate.HasValue)
                query = query.Where(x => x.po.CreatedAt <= searchDto.ToDate);

            // Lọc theo khoảng ngày dự kiến giao
            if (searchDto.FromPlannedDate.HasValue)
                query = query.Where(x => x.po.PlannedDate >= searchDto.FromPlannedDate);

            if (searchDto.ToPlannedDate.HasValue)
                query = query.Where(x => x.po.PlannedDate <= searchDto.ToPlannedDate);

            // Lọc theo danh sách kho được phép (cho Manager/Staff)
            if (searchDto.AuthorizedLocationIds != null && searchDto.AuthorizedLocationIds.Any())
                query = query.Where(x => x.po.ToLocationId.HasValue && searchDto.AuthorizedLocationIds.Contains(x.po.ToLocationId.Value));

            // Lọc theo người tạo
            if (searchDto.CreatedById.HasValue)
                query = query.Where(x => x.po.CreatedById == searchDto.CreatedById);

            // Sắp xếp mới nhất lên đầu
            query = query.OrderByDescending(x => x.po.CreatedAt);

            // Lấy tất cả dữ liệu về memory để search tiếng Việt
            var allItems = await query
                .Select(x => new PurchaseOrderResponseDto
                {
                    Id = x.po.Id,
                    DocId = x.sd != null ? x.sd.Id : 0,
                    DocumentNo = x.sd != null ? x.sd.DocumentNo : null,
                    Origin = x.sd != null ? x.sd.Origin : null,
                    SupplierId = x.po.SupplierId,
                    SupplierName = x.po.Supplier != null ? x.po.Supplier.Name : null,
                    ToLocationId = x.po.ToLocationId,
                    ToLocationName = x.po.ToLocation != null ? x.po.ToLocation.Name : null,
                    Status = x.po.Status,
                    CreatedAt = x.po.CreatedAt,
                    ConfirmedAt = x.po.ConfirmedAt,
                    CompletedAt = x.po.CompletedAt,
                    PlannedDate = x.po.PlannedDate,
                    ItemCount = x.po.PurchaseOrderItems.Count(),
                    TotalQuantity = x.po.PurchaseOrderItems.Sum(oi => oi.OrderedQty ?? 0),
                })
                .ToListAsync();

            // Tìm theo từ khoá: match supplierName HOẶC toLocationName (Vietnamese search)
            if (!string.IsNullOrWhiteSpace(searchDto.Search))
            {
                allItems = allItems.Where(x =>
                    TextNormalizer.ContainsNormalized(x.SupplierName, searchDto.Search) ||
                    TextNormalizer.ContainsNormalized(x.ToLocationName, searchDto.Search) ||
                    TextNormalizer.ContainsNormalized(x.DocumentNo, searchDto.Search)
                ).ToList();
            }

            var totalCount = allItems.Count;

            // Phân trang client-side
            var items = allItems
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToList();

            return (items, totalCount);
        }

        public async Task<PurchaseOrderResponseDto?> GetDetailByIdAsync(int id)
        {
            var result = await (
                from po in _context.PurchaseOrders
                    .Include(p => p.Supplier)
                    .Include(p => p.ToLocation)
                join sd in _context.StockDocuments
                    on new { RefId = (int?)po.Id, RefType = "PurchaseOrder" }
                    equals new { RefId = sd.ReferenceId, RefType = sd.ReferenceType } into sdGroup
                from sd in sdGroup.DefaultIfEmpty()
                where po.Id == id
                select new PurchaseOrderResponseDto
                {
                    Id = po.Id,
                    DocId = sd != null ? sd.Id : 0,
                    DocumentNo = sd != null ? sd.DocumentNo : null,
                    Origin = sd != null ? sd.Origin : null,
                    SupplierId = po.SupplierId,
                    SupplierName = po.Supplier != null ? po.Supplier.Name : null,
                    ToLocationId = po.ToLocationId,
                    ToLocationName = po.ToLocation != null ? po.ToLocation.Name : null,
                    Status = po.Status,
                    CreatedAt = po.CreatedAt,
                    ConfirmedAt = po.ConfirmedAt,
                    CompletedAt = po.CompletedAt,
                    PlannedDate = po.PlannedDate,
                    ItemCount = po.PurchaseOrderItems.Count(),
                    TotalQuantity = po.PurchaseOrderItems.Sum(oi => oi.OrderedQty ?? 0),
                }
            ).FirstOrDefaultAsync();

            return result;
        }

        public async Task DeleteAsync(PurchaseOrder order)
        {
            if (order == null) throw new ArgumentNullException(nameof(order));
            _context.PurchaseOrders.Remove(order);
            await Task.CompletedTask;
        }
    }
}

