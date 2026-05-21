using Inventory.Application.DTOs;

namespace Inventory.Application.IServices;

public interface IProductService
{
    Task<PagedResultDto<ProductDto>> GetAllAsync(
        string? search = null,
        string? searchField = null,
        bool? isActive = null,
        int? categoryId = null,
        int page = 1,
        int pageSize = 5);
    Task<IEnumerable<ProductDto>> GetByLocationIdAsync(int locationId);
    Task<ProductDto> GetByIdAsync(int id);
    Task<ProductDto> GetByCodeAsync(string code);
    Task CreateAsync(CreateProductDto dto);
    Task UpdateAsync(int id, UpdateProductDto dto);
    Task SoftDeleteAsync(int id);
    Task RestoreAsync(int id);
    Task<PriceCalculationResponseDto> CalculatePriceAsync(PriceCalculationDto dto);
}
