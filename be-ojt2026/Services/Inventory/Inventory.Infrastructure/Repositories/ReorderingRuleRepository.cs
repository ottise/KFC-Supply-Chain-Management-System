using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class ReorderingRuleRepository : IReorderingRuleRepository
    {
        private readonly InventoryDbContext _context;

        public ReorderingRuleRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<ReorderingRule> CreateReOrderingRuleAsync(ReorderingRule request)
        {
            await _context.ReorderingRules.AddAsync(request);
            return request;
        }

        //soft
        public async Task<ReorderingRule?> DeleteReorderingRuleAsync(int productWarehouseId)
        {
            var reOrder = await _context.ReorderingRules
                            .Where(r => r.ProductWarehouseId == productWarehouseId)
                            .FirstOrDefaultAsync();
            if (reOrder == null)
            {
                return null;
            }
            
            reOrder.IsActive = false;
            _context.ReorderingRules.Update(reOrder);

            return reOrder;
        }

        public async Task<ReorderingRule?> ChangeStatusAsync(int productWarehouseId, bool isActive)
        {
            var reOrder = await _context.ReorderingRules
                .Where(r => r.ProductWarehouseId == productWarehouseId)
                .FirstOrDefaultAsync();
            if (reOrder == null)
            {
                return null;
            }

            reOrder.IsActive = isActive;
            _context.ReorderingRules.Update(reOrder);

            return reOrder;
        }

        public async Task<ReorderingRule> UpdateReOrderingRuleAsync(ReorderingRule request)
        {
            _context.ReorderingRules.Update(request);
            return await Task.FromResult(request);

        }


        public async Task<ReorderingRule?> CheckExistingReorderRuleAsync(int productWarehouseId)
        {
            return await _context.ReorderingRules
                .Where(r => r.ProductWarehouseId == productWarehouseId)
                .FirstOrDefaultAsync();
        }


        public async Task<ReorderingRule?> GetActiveReorderingRuleAsync(int productWarehouseId)
        {
            return await _context.ReorderingRules
                .Where(r => r.ProductWarehouseId == productWarehouseId && r.IsActive == true)
                .FirstOrDefaultAsync();
        }

        public async Task<(IEnumerable<ReorderingRule> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? productWarehouseId = null, int? managerId = null, int? warehouseId = null)
        {
            var query = _context.ReorderingRules
                .Include(r => r.ProductWarehouse).ThenInclude(pw => pw.Product).ThenInclude(p => p.BaseUom)
                .Include(r => r.ProductWarehouse).ThenInclude(pw => pw.Warehouse)
                .AsQueryable();
            
            if (isActive.HasValue)
            {
                query = query.Where(r => r.IsActive == isActive.Value);
            }

            if (managerId.HasValue)
            {
                query = query.Where(r => r.ProductWarehouse.Warehouse.ManagerId == managerId.Value);
            }

            if (productWarehouseId.HasValue)
            {
                query = query.Where(r => r.ProductWarehouseId == productWarehouseId.Value);
            }

            if (warehouseId.HasValue)
            {
                query = query.Where(r => r.ProductWarehouse.WarehouseId == warehouseId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim().ToLower();
                query = query.Where(r =>
                    (r.TriggerType != null && r.TriggerType.ToLower().Contains(searchTerm)) ||
                    (r.ProductWarehouse != null && r.ProductWarehouse.Product != null && r.ProductWarehouse.Product.Name.ToLower().Contains(searchTerm)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(r => r.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
        public async Task<(IEnumerable<(ReorderingRule Rule, decimal AvailableQty)> Items, int TotalCount)> GetRulesBelowMinQtyAsync(int page, int pageSize, int? managerId = null, int? warehouseId = null)
        {
            var query = _context.ReorderingRules
                .Include(r => r.ProductWarehouse)
                    .ThenInclude(pw => pw.Product)
                        .ThenInclude(p => p.BaseUom)
                .Include(r => r.ProductWarehouse)
                    .ThenInclude(pw => pw.Warehouse)
                .Where(r => r.IsActive == true && r.MinQty.HasValue && r.ProductWarehouse.IsActive == true && r.ProductWarehouse.Product.IsActive == true);

            if (managerId.HasValue)
            {
                query = query.Where(r => r.ProductWarehouse.Warehouse.ManagerId == managerId.Value);
            }

            if (warehouseId.HasValue)
            {
                query = query.Where(r => r.ProductWarehouse.WarehouseId == warehouseId.Value);
            }

            var warningsQuery = query
                .Select(r => new
                {
                    Rule = r,
                    AvailableQty = _context.CurrentInventories
                        .Where(ci => ci.ProductId == r.ProductWarehouse.ProductId
                                  && ci.Location != null
                                  && ci.Location.WarehouseId == r.ProductWarehouse.WarehouseId)
                        .Sum(ci => (ci.Quantity ?? 0) - (ci.ReservedQuantity ?? 0))
                })
                .Where(x => x.AvailableQty < x.Rule.MinQty!.Value);

            var totalCount = await warningsQuery.CountAsync();
            
            var warnings = await warningsQuery
                .OrderBy(x => x.Rule.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (warnings.Select(w => (w.Rule, w.AvailableQty)), totalCount);
        }
    }
}
