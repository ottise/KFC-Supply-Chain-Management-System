using BuildingBlocks.Exceptions;
using BuildingBlocks.Utils;
using Inventory.Application.DTOs;
using Inventory.Application.DTOs.ProductWarehouse;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
namespace Inventory.Application.Services;

public class ProductWarehouseService : IProductWarehouseService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductWarehouseService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<ProductWarehouseDto>> GetAllAsync(
        int? managerId = null,
        string? search = null,
        string? searchField = null,
        bool? isActive = null,
        int? categoryId = null,
        int page = 1,
        int pageSize = 5)
    {
        var rawEntities = await _unitOfWork.ProductWarehouse.GetAllAsync(managerId);
        var query = rawEntities.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(pw => pw.IsActive == isActive.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(pw => pw.Product != null && pw.Product.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = TextNormalizer.NormalizeForSearch(search);

            if (string.Equals(searchField, "code", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(pw => pw.Product != null && TextNormalizer.NormalizeForSearch(pw.Product.Code).Contains(normalizedSearch, StringComparison.Ordinal));
            }
            else if (string.Equals(searchField, "name", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(pw => pw.Product != null && TextNormalizer.NormalizeForSearch(pw.Product.Name).Contains(normalizedSearch, StringComparison.Ordinal));
            }
            else
            {
                query = query.Where(pw => pw.Product != null &&
                    (TextNormalizer.NormalizeForSearch(pw.Product.Name).Contains(normalizedSearch, StringComparison.Ordinal)
                    || TextNormalizer.NormalizeForSearch(pw.Product.Code).Contains(normalizedSearch, StringComparison.Ordinal)));
            }
        }

        if (page <= 0)
            throw new BadRequestException("page must be greater than 0.");

        if (pageSize <= 0)
            throw new BadRequestException("pageSize must be greater than 0.");

        var filteredList = query.ToList();
        var totalItems = filteredList.Count;
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = filteredList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x =>
            {
                var activeRule = x.ReorderingRules?.OrderByDescending(r => r.Id).FirstOrDefault();
                return new ProductWarehouseDto
                {
                    Id = x.Id,
                    ProductId = x.ProductId,
                    ProductName = x.Product?.Name ?? string.Empty,
                    ProductCode = x.Product?.Code ?? string.Empty,
                    CategoryName = x.Product?.Category?.Name ?? string.Empty,
                    CategoryId = x.Product?.CategoryId,
                    BaseUomId = x.Product?.BaseUomId,
                    BaseUomName = x.Product?.BaseUom?.Name ?? string.Empty,
                    WarehouseId = x.WarehouseId,
                    WarehouseName = x.Warehouse?.Name ?? string.Empty,
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt,
                    CreatedById = x.CreatedById,
                    MinQty = activeRule?.MinQty,
                    MaxQty = activeRule?.MaxQty,
                    SalePrice = x.Product?.SalePrice,
                    HasReorderingRule = activeRule != null
                };
            }).ToList();

        return new PagedResultDto<ProductWarehouseDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            HasNext = page < totalPages,
            HasPrevious = page > 1 && totalItems > 0
        };
    }

    public async Task<PagedResultDto<ProductWarehouseDto>> GetByWarehouseIdAsync(
        int warehouseId, 
        int? managerId = null, 
        int? userId = null,
        string? search = null,
        string? searchField = null,
        bool? isActive = null,
        int? categoryId = null,
        int page = 1,
        int pageSize = 5)
    {
        var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(warehouseId);
        if (warehouse == null)
            throw new KeyNotFoundException($"Không tìm thấy kho ID {warehouseId}");

        if (warehouse.ManagerId != managerId && warehouse.ManagerId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem dữ liệu của kho này do không phải quản lý của kho.");
        }

        var rawEntities = await _unitOfWork.ProductWarehouse.GetByWarehouseIdAsync(warehouseId);
        var query = rawEntities.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(pw => pw.IsActive == isActive.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(pw => pw.Product != null && pw.Product.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = TextNormalizer.NormalizeForSearch(search);

            if (string.Equals(searchField, "code", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(pw => pw.Product != null && TextNormalizer.NormalizeForSearch(pw.Product.Code).Contains(normalizedSearch, StringComparison.Ordinal));
            }
            else if (string.Equals(searchField, "name", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(pw => pw.Product != null && TextNormalizer.NormalizeForSearch(pw.Product.Name).Contains(normalizedSearch, StringComparison.Ordinal));
            }
            else
            {
                query = query.Where(pw => pw.Product != null &&
                    (TextNormalizer.NormalizeForSearch(pw.Product.Name).Contains(normalizedSearch, StringComparison.Ordinal)
                    || TextNormalizer.NormalizeForSearch(pw.Product.Code).Contains(normalizedSearch, StringComparison.Ordinal)));
            }
        }

        if (page <= 0)
            throw new BadRequestException("page must be greater than 0.");

        if (pageSize <= 0)
            throw new BadRequestException("pageSize must be greater than 0.");

        var filteredList = query.ToList();
        var totalItems = filteredList.Count;
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = filteredList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x =>
            {
                var activeRule = x.ReorderingRules?.OrderByDescending(r => r.Id).FirstOrDefault();
                return new ProductWarehouseDto
                {
                    Id = x.Id,
                    ProductId = x.ProductId,
                    ProductName = x.Product?.Name ?? string.Empty,
                    ProductCode = x.Product?.Code ?? string.Empty,
                    CategoryName = x.Product?.Category?.Name ?? string.Empty,
                    CategoryId = x.Product?.CategoryId,
                    BaseUomId = x.Product?.BaseUomId,
                    BaseUomName = x.Product?.BaseUom?.Name ?? string.Empty,
                    WarehouseId = x.WarehouseId,
                    WarehouseName = x.Warehouse?.Name ?? string.Empty,
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt,
                    CreatedById = x.CreatedById,
                    MinQty = activeRule?.MinQty,
                    MaxQty = activeRule?.MaxQty,
                    SalePrice = x.Product?.SalePrice,
                    HasReorderingRule = activeRule != null
                };
            }).ToList();

        return new PagedResultDto<ProductWarehouseDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            HasNext = page < totalPages,
            HasPrevious = page > 1 && totalItems > 0
        };
    }

    public async Task<ProductWarehouseDto> AddProductToWarehouseAsync(AddProductWarehouseDto request, int? userId, int? managerId)
    {
        // 1. Validate Product
        var product = await _unitOfWork.Product.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm ID {request.ProductId}");

        // 2. Validate Warehouse
        var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(request.WarehouseId);
        if (warehouse == null)
            throw new KeyNotFoundException($"Không tìm thấy kho ID {request.WarehouseId}");

        // 3. Authorization Check
        if (warehouse.ManagerId != managerId && warehouse.ManagerId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này vì bạn không phải quản lý của kho.");
        }

        // 4. Check exist
        var exist = await _unitOfWork.ProductWarehouse.GetByProductAndWarehouseAsync(request.ProductId, request.WarehouseId);
        if (exist != null)
        {
            throw new InvalidOperationException($"Sản phẩm này đã tồn tại trong kho (có thể đang bị vô hiệu hóa), vui lòng dùng tính năng sửa trạng thái để thay đổi.");
        }

        // 5. Create
        var newEntity = new Domain.Entities.ProductWarehouse
        {
            ProductId = request.ProductId,
            WarehouseId = request.WarehouseId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId ?? managerId
        };

        await _unitOfWork.ProductWarehouse.AddAsync(newEntity);
        await _unitOfWork.SaveChangesAsync();

        return await GetDtoById(newEntity.Id);
    }

    public async Task<bool> RemoveProductFromWarehouseAsync(int id, int? managerId = null, int? userId = null)
    {
        var entity = await _unitOfWork.ProductWarehouse.GetByIdAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm trong kho với ID {id}");

        if (entity.Warehouse.ManagerId != managerId && entity.Warehouse.ManagerId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này do không phải quản lý của kho.");
        }

        entity.IsActive = false;
        await _unitOfWork.ProductWarehouse.UpdateAsync(entity);

        // Vô hiệu hóa quy tắc đặt hàng (nếu có) khi sản phẩm bị xóa khỏi kho
        var rule = await _unitOfWork.ReorderingRule.CheckExistingReorderRuleAsync(id);
        if (rule != null)
        {
            rule.IsActive = false;
            await _unitOfWork.ReorderingRule.UpdateReOrderingRuleAsync(rule);
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<ProductWarehouseDto> ChangeStatusAsync(int id, bool isActive, int? managerId = null, int? userId = null)
    {
        var entity = await _unitOfWork.ProductWarehouse.GetByIdAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm trong kho với ID {id}");

        if (entity.Warehouse.ManagerId != managerId && entity.Warehouse.ManagerId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên kho này do không phải quản lý của kho.");
        }

        entity.IsActive = isActive;
        await _unitOfWork.ProductWarehouse.UpdateAsync(entity);

        // Cập nhật trạng thái quy tắc đặt hàng đồng bộ với sản phẩm trong kho
        var rule = await _unitOfWork.ReorderingRule.CheckExistingReorderRuleAsync(id);
        if (rule != null)
        {
            rule.IsActive = isActive;
            await _unitOfWork.ReorderingRule.UpdateReOrderingRuleAsync(rule);
        }

        await _unitOfWork.SaveChangesAsync();
        
        return await GetDtoById(entity.Id);
    }

    private async Task<ProductWarehouseDto> GetDtoById(int id)
    {
        var x = await _unitOfWork.ProductWarehouse.GetByIdAsync(id);
        if(x == null) throw new KeyNotFoundException("Lỗi kho khởi tạo dto");
        
        var activeRule = x.ReorderingRules?.OrderByDescending(r => r.Id).FirstOrDefault();
        
        return new ProductWarehouseDto
        {
            Id = x.Id,
            ProductId = x.ProductId,
            ProductName = x.Product?.Name ?? string.Empty,
            ProductCode = x.Product?.Code ?? string.Empty,
            CategoryName = x.Product?.Category?.Name ?? string.Empty,
            CategoryId = x.Product?.CategoryId,
            BaseUomId = x.Product?.BaseUomId,
            BaseUomName = x.Product?.BaseUom?.Name ?? string.Empty,
            WarehouseId = x.WarehouseId,
            WarehouseName = x.Warehouse?.Name ?? string.Empty,
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt,
            CreatedById = x.CreatedById,
            MinQty = activeRule?.MinQty,
            MaxQty = activeRule?.MaxQty,
            SalePrice = x.Product?.SalePrice,
            HasReorderingRule = activeRule != null
        };
    }
}
