using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface IUomRepository
{
    Task<IEnumerable<Uom>> GetAllAsync();

    Task<(IEnumerable<Uom> Items, int TotalCount)> GetPaginatedAsync(int pageIndex, int pageSize, string? category = null, bool? isBaseUnit = null, string? search = null);

    Task<Uom?> GetByIdAsync(int id);

    Task<Uom?> GetBaseUnitByCategoryAsync(string category);

    Task<(IEnumerable<Uom> Items, int TotalCount)> GetPaginatedByCategoryAsync(string category, int page, int pageSize);

    Task AddAsync(Uom uom);

    Task UpdateAsync(Uom uom);

    Task DeleteAsync(Uom uom);

    Task<bool> IsUsedByProductsOrStockTransactionsAsync(int uomId);

    Task<decimal> ValidateUomAsync(int uomBaseId, int purchaseUomId);
}
