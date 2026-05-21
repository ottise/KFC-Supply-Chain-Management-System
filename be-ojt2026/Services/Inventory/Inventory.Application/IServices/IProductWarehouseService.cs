using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ProductWarehouse;

namespace Inventory.Application.IServices;

public interface IProductWarehouseService
{
    Task<PagedResultDto<ProductWarehouseDto>> GetAllAsync(int? managerId = null, string? search = null, string? searchField = null, bool? isActive = null, int? categoryId = null, int page = 1, int pageSize = 5);
    Task<PagedResultDto<ProductWarehouseDto>> GetByWarehouseIdAsync(int warehouseId, int? managerId = null, int? userId = null, string? search = null, string? searchField = null, bool? isActive = null, int? categoryId = null, int page = 1, int pageSize = 5);
    Task<ProductWarehouseDto> AddProductToWarehouseAsync(AddProductWarehouseDto request, int? userId, int? managerId);
    Task<bool> RemoveProductFromWarehouseAsync(int id, int? managerId = null, int? userId = null);
    Task<ProductWarehouseDto> ChangeStatusAsync(int id, bool isActive, int? managerId = null, int? userId = null);
}
