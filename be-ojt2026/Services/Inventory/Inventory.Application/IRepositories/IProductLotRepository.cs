using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface IProductLotRepository
{
    Task<IEnumerable<ProductLot>> GetAllAsync();

    Task<(IEnumerable<ProductLot> Items, int TotalCount)> GetPaginatedAsync(
        int pageIndex,
        int pageSize,
        string? lotNumber = null,
        DateTime? expirationDateFrom = null,
        DateTime? expirationDateTo = null);

    Task<ProductLot?> GetByIdAsync(int id);

    Task<(IEnumerable<ProductLot> Items, int TotalCount)> SearchAsync(int pageIndex, int pageSize, string? keyword, int? productId, int? managerId, int? locationId, DateTime? expirationDateBefore, DateTime? expirationDateAfter, int? expiresWithinDays);

    Task<ProductLot?> GetProductLotByLotIdAndProductId(int productId, int lotId);

    Task<ProductLot> CreateProductLot(ProductLot productLot);

    Task UpdateAsync(ProductLot productLot);

    Task DeleteAsync(ProductLot productLot);

    Task<bool> IsLotReferencedAsync(int lotId);

    Task<IEnumerable<ProductLot>> GetLotsByLocationIdAsync(int locationId);

    Task<IEnumerable<ProductLot>> GetLotsByLocationAndProductAsync(int locationId, int productId);
}
