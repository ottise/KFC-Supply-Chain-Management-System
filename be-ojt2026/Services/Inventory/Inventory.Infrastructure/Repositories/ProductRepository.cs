using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly InventoryDbContext _context;

    public ProductRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _context.Products
            .Include(p => p.BaseUom)
            .Include(p => p.PurchaseUom)
            .Include(p => p.Category)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetAllActiveAsync()
    {
        return await _context.Products
            .Include(p => p.BaseUom)
            .Include(p => p.PurchaseUom)
            .Include(p => p.Category)
            .Where(p => p.IsActive == true)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetAllArchivedAsync()
    {
        return await _context.Products
            .Include(p => p.BaseUom)
            .Include(p => p.PurchaseUom)
            .Include(p => p.Category)
            .Where(p => p.IsActive == false)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetByLocationIdAsync(int locationId)
    {
        // 1. Lấy thông tin WarehouseId từ LocationId
        var location = await _context.Locations.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == locationId);

        if (location == null || location.WarehouseId == null)
        {
            return new List<Product>();
        }

        var warehouseId = location.WarehouseId.Value;

        // 2. Lấy danh sách ProductId có tồn kho tại Location này
        var productIdsInStock = await _context.CurrentInventories.AsNoTracking()
            .Where(ci => ci.LocationId == locationId && ci.ProductId != null)
            .Select(ci => ci.ProductId!.Value)
            .Distinct()
            .ToListAsync();

        if (!productIdsInStock.Any())
        {
            return new List<Product>();
        }

        // 3. Lọc sản phẩm: 
        // - Nằm trong danh sách có tồn tại ở location (productIdsInStock)
        // - Sản phẩm đang hoạt động (p.IsActive == true)
        // - Sản phẩm được gán cho kho này và đang hoạt động trong kho đó (ProductWarehouse)
        return await _context.Products
            .Include(p => p.BaseUom)
            .Include(p => p.PurchaseUom)
            .Include(p => p.Category)
            .Where(p => productIdsInStock.Contains(p.Id) && p.IsActive == true)
            .Where(p => _context.ProductWarehouses.Any(pw => 
                pw.ProductId == p.Id && 
                pw.WarehouseId == warehouseId && 
                pw.IsActive == true))
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _context.Products
            .Include(p => p.BaseUom)
            .Include(p => p.PurchaseUom)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetByCodeAsync(string code)
    {
        return await _context.Products
            .Include(p => p.BaseUom)
            .Include(p => p.PurchaseUom)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Code.ToLower() == code.ToLower());
    }

    public async Task AddAsync(Product product)
    {
        await _context.Products.AddAsync(product);
    }

    public void Update(Product product)
    {
        _context.Products.Update(product);
    }

    public async Task<int> GetNextSequenceAsync(string productType, string categoryCode)
    {
        var prefix = $"KFC-{productType}-{categoryCode}-";
        var count = await _context.Products
            .CountAsync(p => p.Code.StartsWith(prefix));
        return count + 1;
    }
    public async Task<List<string>> GetDistinctProductTypesAsync()
    {
        return await _context.Products
                    .Where(p => p.IsActive == true && !string.IsNullOrWhiteSpace(p.ProductType))
                    .Select(p => p.ProductType!)
                    .Distinct()
                    .ToListAsync();
    }
}
