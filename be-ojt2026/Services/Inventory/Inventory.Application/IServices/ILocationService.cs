using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface ILocationService
    {
        Task<LocationDto> CreateAsync(CreateLocationDto dto);

        Task<IEnumerable<LocationDto>> GetAllAsync();

        Task<IEnumerable<LocationDto>> GetByWarehouseIdAsync(int warehouseId);

        Task<PagedResultDto<LocationDto>> GetPaginatedAsync(int page, int pageSize, int? warehouseId = null, bool? isActive = null, string? search = null, bool? isParent = null, int? parentId = null, int? managerId = null);

        Task<LocationDto?> GetByIdAsync(int id);

        Task<LocationDto> UpdateAsync(int id, LocationDto dto);

        Task DeactivateAsync(int id);

        Task ActivateAsync(int id);

        Task DeleteAsync(int id);
        
        Task<List<Location>> GetLocationByWarehouseIdAsync(int warehouseId);
    }
}
