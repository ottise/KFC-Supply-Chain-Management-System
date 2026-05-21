using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices;

public interface IProductLotService
{
    Task<IEnumerable<ProductLotDto>> GetAllAsync();

    Task<PagedResultDto<ProductLotDto>> GetPaginatedAsync(
        int page,
        int pageSize,
        string? lotNumber = null,
        DateTime? expirationDateFrom = null,
        DateTime? expirationDateTo = null);

    Task<ProductLotDto?> GetByIdAsync(int id);

    Task<PagedResultDto<ProductLotDto>> SearchAsync(int page, int pageSize, string? keyword, int? productId, int? managerId, int? locationId, DateTime? expirationDateBefore, DateTime? expirationDateAfter, int? expiresWithinDays);

    Task<ProductLot?> GetProductLotByLotIdAndProductId(int productId, int lotId);

    Task<ProductLot> CreateProductLot(ProductLot productLot);

    Task<ProductLotDto> CreateAsync(CreateProductLotDto dto);

    Task<ProductLotDto> UpdateAsync(int id, CreateProductLotDto dto);

    Task DeleteAsync(int id);
    Task<bool> IsLotReferencedAsync(int id);
    Task<IEnumerable<ProductLotDto>> GetByLocationIdAsync(int locationId);

    Task<IEnumerable<ProductLotDto>> GetByLocationAndProductAsync(int locationId, int productId);
}
