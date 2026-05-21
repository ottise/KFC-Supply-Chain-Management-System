using Inventory.Application.DTOs;

namespace Inventory.Application.IServices;

public interface IUomService
{
    Task<IEnumerable<UomDto>> GetAllAsync();

    Task<IReadOnlyList<string>> GetCategoriesAsync();

    Task<PagedResultDto<UomDto>> GetPaginatedAsync(int page, int pageSize, string? category = null, bool? isBaseUnit = null, string? search = null);

    Task<UomDto?> GetByIdAsync(int id);

    Task<PagedResultDto<UomDto>> GetByCategoryPaginatedAsync(string category, int page, int pageSize);

    Task<UomDto> CreateBaseUnitAsync(CreateBaseUomDto dto);

    Task<UomDto> CreateAsync(CreateUomDto dto);

    Task<UomDto> UpdateAsync(int id, CreateUomDto dto);

    Task<UomDto> UpdateBaseUnitAsync(int id, UpdateBaseUomDto dto);

    Task<UomDto> UpdateBaseUnitByCategoryAsync(string category, UpdateBaseUomDto dto);

    Task DeleteAsync(int id);

    Task<decimal> ValidateUomAsync(int uomBaseId, int purchaseUomId);
}
