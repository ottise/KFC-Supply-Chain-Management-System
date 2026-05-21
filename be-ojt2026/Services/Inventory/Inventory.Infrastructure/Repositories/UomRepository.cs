using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories;

public class UomRepository : IUomRepository
{
    private readonly InventoryDbContext _context;

    public UomRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Uom>> GetAllAsync()
    {
        return await _context.Uoms.ToListAsync();
    }

    public async Task<(IEnumerable<Uom> Items, int TotalCount)> GetPaginatedAsync(int pageIndex, int pageSize, string? category = null, bool? isBaseUnit = null, string? search = null)
    {
        var query = _context.Uoms.AsQueryable();
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(u => u.Category == category);
        }

        if (isBaseUnit.HasValue)
        {
            query = query.Where(u => u.IsBaseUnit == isBaseUnit.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(u => u.Name != null && u.Name.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(u => u.Category)
            .ThenBy(u => u.Id)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Uom?> GetByIdAsync(int id)
    {
        return await _context.Uoms.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Uom?> GetBaseUnitByCategoryAsync(string category)
    {
        return await _context.Uoms
            .FirstOrDefaultAsync(u => u.Category == category && u.IsBaseUnit == true);
    }

    public async Task<(IEnumerable<Uom> Items, int TotalCount)> GetPaginatedByCategoryAsync(string category, int page, int pageSize)
    {
        var query = _context.Uoms
            .Where(u => u.Category == category)
            .OrderBy(u => u.IsBaseUnit == true ? 0 : 1)
            .ThenBy(u => u.Id);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task AddAsync(Uom uom)
    {
        await _context.Uoms.AddAsync(uom);
    }

    public Task UpdateAsync(Uom uom)
    {
        _context.Uoms.Update(uom);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Uom uom)
    {
        _context.Uoms.Remove(uom);
        return Task.CompletedTask;
    }

    public async Task<bool> IsUsedByProductsOrStockTransactionsAsync(int uomId)
    {
        var usedByProducts = await _context.Products
            .AnyAsync(p => p.BaseUomId == uomId || p.PurchaseUomId == uomId);
        if (usedByProducts)
            return true;

        var usedByStockTransactions = await _context.StockTransactions
            .AnyAsync(s => s.UomId == uomId);
        return usedByStockTransactions;
    }

    public async Task<decimal> ValidateUomAsync(int uomBaseId, int purchaseUomId)
    {
        var baseUom = await _context.Uoms.FindAsync(uomBaseId);
        var purchaseUom = await _context.Uoms.FindAsync(purchaseUomId);

        if (baseUom == null)
            throw new ArgumentException($"Base UOM {uomBaseId} not found");

        if (purchaseUom == null)
            throw new ArgumentException($"Purchase UOM {purchaseUomId} not found");


        if (baseUom.Category != purchaseUom.Category)
            throw new InvalidOperationException("Base UOM and Purchase UOM must belong to the same category");

        if (baseUom.Id == purchaseUom.Id)
        {
            return 1;
        }

        if (purchaseUom.ConversionRatio == null || purchaseUom.ConversionRatio <= 0)
            throw new InvalidOperationException("Purchase UOM must have a valid ConversionRatio");

        return purchaseUom.ConversionRatio.Value;
    }

}
