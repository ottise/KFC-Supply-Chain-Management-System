using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories;

public class ProductLotRepository : IProductLotRepository
{
    private readonly InventoryDbContext _context;

    public ProductLotRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductLot>> GetAllAsync()
    {
        return await _context.ProductLots
            .Include(pl => pl.Product)
            .OrderBy(pl => pl.Id)
            .ToListAsync();
    }

    public async Task<(IEnumerable<ProductLot> Items, int TotalCount)> GetPaginatedAsync(
        int pageIndex,
        int pageSize,
        string? lotNumber = null,
        DateTime? expirationDateFrom = null,
        DateTime? expirationDateTo = null)
    {
        var query = _context.ProductLots
            .Include(pl => pl.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(lotNumber))
        {
            var term = lotNumber.Trim().ToLower();
            query = query.Where(pl => pl.LotNumber != null && pl.LotNumber.ToLower().Contains(term));
        }

        if (expirationDateFrom.HasValue)
            query = query.Where(pl => pl.ExpirationDate >= expirationDateFrom.Value);

        if (expirationDateTo.HasValue)
            query = query.Where(pl => pl.ExpirationDate <= expirationDateTo.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(pl => pl.Id)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<ProductLot?> GetByIdAsync(int id)
    {
        return await _context.ProductLots
            .Include(pl => pl.Product)
            .FirstOrDefaultAsync(pl => pl.Id == id);
    }

    public async Task<(IEnumerable<ProductLot> Items, int TotalCount)> SearchAsync(int pageIndex, int pageSize, string? keyword, int? productId, int? managerId, int? locationId, DateTime? expirationDateBefore, DateTime? expirationDateAfter, int? expiresWithinDays)
    {
        var query = _context.ProductLots
            .Include(pl => pl.Product)
            .AsQueryable();

        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(pl => pl.ProductId == productId.Value);
        }

        if (locationId.HasValue && locationId.Value > 0)
        {
            query = query.Where(pl => pl.CurrentInventories.Any(ci => ci.LocationId == locationId.Value));
        }

        if (managerId.HasValue && managerId.Value > 0)
        {
            query = query.Where(pl => pl.CurrentInventories.Any(ci => ci.Location != null && ci.Location.Warehouse != null && ci.Location.Warehouse.ManagerId == managerId.Value));
        }

        if (expiresWithinDays.HasValue && expiresWithinDays.Value > 0)
        {
            var targetDate = DateTime.UtcNow.AddDays(expiresWithinDays.Value);
            var now = DateTime.UtcNow;
            query = query.Where(pl => pl.ExpirationDate >= now && pl.ExpirationDate <= targetDate);
        }

        if (expirationDateBefore.HasValue)
        {
            query = query.Where(pl => pl.ExpirationDate <= expirationDateBefore.Value);
        }

        if (expirationDateAfter.HasValue)
        {
            query = query.Where(pl => pl.ExpirationDate >= expirationDateAfter.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim().ToLower();
            query = query.Where(pl => 
                (pl.LotNumber != null && pl.LotNumber.ToLower().Contains(term)) ||
                (pl.Product != null && pl.Product.Name.ToLower().Contains(term)) ||
                (pl.Product != null && pl.Product.Code.ToLower().Contains(term)) ||
                (pl.CurrentInventories.Any(ci => ci.Location != null && ci.Location.Name != null && ci.Location.Name.ToLower().Contains(term)))
            );
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(pl => pl.Id)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<ProductLot?> GetProductLotByLotIdAndProductId(int productId, int lotId)
    {
        return await _context.ProductLots
            .FirstOrDefaultAsync(pl => pl.ProductId == productId && pl.Id == lotId);
    }

    public async Task<ProductLot> CreateProductLot(ProductLot productLot)
    {
        await _context.ProductLots.AddAsync(productLot);
        return productLot;
    }

    public Task UpdateAsync(ProductLot productLot)
    {
        _context.ProductLots.Update(productLot);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ProductLot productLot)
    {
        _context.ProductLots.Remove(productLot);
        return Task.CompletedTask;
    }

    public async Task<bool> IsLotReferencedAsync(int lotId)
    {
        var inCurrentInventory = await _context.CurrentInventories.AnyAsync(c => c.LotId == lotId);
        if (inCurrentInventory) return true;
        var inScrapOrderItems = await _context.ScrapOrderItems.AnyAsync(s => s.LotId == lotId);
        if (inScrapOrderItems) return true;
        var inAdjustmentItems = await _context.InventoryAdjustmentItems.AnyAsync(a => a.LotId == lotId);
        if (inAdjustmentItems) return true;
        var inStockTransactions = await _context.StockTransactions.AnyAsync(t => t.LotId == lotId);
        return inStockTransactions;
    }

    public async Task<IEnumerable<ProductLot>> GetLotsByLocationIdAsync(int locationId)
    {
        var lotIds = await _context.CurrentInventories
            .Where(ci => ci.LocationId == locationId && ci.LotId != null)
            .Select(ci => ci.LotId.Value)
            .Distinct()
            .ToListAsync();

        return await _context.ProductLots
            .Where(pl => lotIds.Contains(pl.Id))
            .Include(pl => pl.Product)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProductLot>> GetLotsByLocationAndProductAsync(int locationId, int productId)
    {
        var lotIds = await _context.CurrentInventories
            .Where(ci => ci.LocationId == locationId && ci.ProductId == productId && ci.LotId != null)
            .Select(ci => ci.LotId.Value)
            .Distinct()
            .ToListAsync();

        if (lotIds.Count == 0)
        {
            return new List<ProductLot>();
        }

        return await _context.ProductLots
            .Where(pl => lotIds.Contains(pl.Id) && pl.ProductId == productId)
            .Include(pl => pl.Product)
            .OrderBy(pl => pl.ExpirationDate)
            .ToListAsync();
    }
}
