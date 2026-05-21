using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;
using Inventory.Domain.Common.Constants;

namespace Inventory.Application.Services;

public class UomService : IUomService
{
    private readonly IUnitOfWork _unitOfWork;

    public UomService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<UomDto>> GetAllAsync()
    {
        var uoms = await _unitOfWork.Uom.GetAllAsync();
        return uoms.Select(MapToDto);
    }

    public Task<IReadOnlyList<string>> GetCategoriesAsync()
    {
        var categories = Enum.GetNames<UomCategory>();
        return Task.FromResult<IReadOnlyList<string>>(categories);
    }

    public async Task<PagedResultDto<UomDto>> GetPaginatedAsync(int page, int pageSize, string? category = null, bool? isBaseUnit = null, string? search = null)
    {
        if (page < 1)
            throw new BadRequestException("Page must be greater than 0.");
        if (pageSize < 1 || pageSize > 100)
            throw new BadRequestException("PageSize must be between 1 and 100.");

        string? categoryStr = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            if (!Enum.TryParse<UomCategory>(category.Trim(), ignoreCase: true, out var parsedCategory))
            {
                var validValues = string.Join(", ", Enum.GetNames<UomCategory>());
                throw new BadRequestException($"Invalid category '{category}'. Valid values: {validValues}");
            }
            categoryStr = parsedCategory.ToString();
        }

        var (items, totalCount) = await _unitOfWork.Uom.GetPaginatedAsync(page, pageSize, categoryStr, isBaseUnit, search);
        var data = items.Select(MapToDto).ToList();
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<UomDto>
        {
            Items = data,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalCount,
            TotalPages = totalPages,
            HasNext = page < totalPages,
            HasPrevious = page > 1 && totalCount > 0
        };
    }

    public async Task<UomDto?> GetByIdAsync(int id)
    {
        var uom = await _unitOfWork.Uom.GetByIdAsync(id);
        return uom == null ? null : MapToDto(uom);
    }

    public async Task<PagedResultDto<UomDto>> GetByCategoryPaginatedAsync(string category, int page, int pageSize)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new BadRequestException("Category is required.");

        if (!Enum.TryParse<UomCategory>(category.Trim(), ignoreCase: true, out var parsedCategory))
        {
            var validValues = string.Join(", ", Enum.GetNames<UomCategory>());
            throw new BadRequestException($"Invalid category '{category}'. Valid values: {validValues}");
        }

        if (page < 1)
            throw new BadRequestException("Page must be greater than 0.");
        if (pageSize < 1 || pageSize > 100)
            throw new BadRequestException("PageSize must be between 1 and 100.");

        var categoryStr = parsedCategory.ToString();
        var (items, totalCount) = await _unitOfWork.Uom.GetPaginatedByCategoryAsync(categoryStr, page, pageSize);
        var data = items.Select(MapToDto).ToList();
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<UomDto>
        {
            Items = data,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalCount,
            TotalPages = totalPages,
            HasNext = page < totalPages,
            HasPrevious = page > 1 && totalCount > 0
        };
    }

    public async Task<UomDto> CreateBaseUnitAsync(CreateBaseUomDto dto)
    {
        if (dto == null)
            throw new BadRequestException("Request body is required.");

        var name = dto.Name?.Trim();
        var categoryStr = ValidateAndParseCategory(dto.Category);

        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("UOM name is required.");
        if (name.Length > 255)
            throw new BadRequestException("UOM name cannot exceed 255 characters.");

        var existingBaseUnit = await _unitOfWork.Uom.GetBaseUnitByCategoryAsync(categoryStr);
        if (existingBaseUnit != null)
        {
            throw new ConflictException(
                $"Category '{categoryStr}' already has a base unit ('{existingBaseUnit.Name}'). Cannot create another base unit for this category.");
        }

        var uom = new Uom
        {
            Name = name,
            Category = categoryStr,
            ConversionRatio = 1,
            IsBaseUnit = true
        };

        await _unitOfWork.Uom.AddAsync(uom);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(uom);
    }

    public async Task<UomDto> CreateAsync(CreateUomDto dto)
    {
        if (dto == null)
            throw new BadRequestException("Request body is required.");

        var name = dto.Name?.Trim();
        var categoryStr = ValidateAndParseCategory(dto.Category);

        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("UOM name is required.");
        if (name.Length > 255)
            throw new BadRequestException("UOM name cannot exceed 255 characters.");
        if (dto.ConversionRatio <= 0)
            throw new BadRequestException("ConversionRatio must be greater than 0.");

        var baseUnit = await _unitOfWork.Uom.GetBaseUnitByCategoryAsync(categoryStr);
        if (baseUnit == null)
        {
            throw new BadRequestException(
                $"Category '{categoryStr}' does not have a base unit yet. Please create a base unit for this category first.");
        }

        var uom = new Uom
        {
            Name = name,
            Category = categoryStr,
            ConversionRatio = dto.ConversionRatio,
            IsBaseUnit = false
        };

        await _unitOfWork.Uom.AddAsync(uom);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(uom);
    }

    public async Task<UomDto> UpdateAsync(int id, CreateUomDto dto)
    {
        if (dto == null)
            throw new BadRequestException("Request body is required.");

        var uom = await _unitOfWork.Uom.GetByIdAsync(id);
        if (uom == null)
            throw new NotFoundException($"The UOM with ID {id} was not found.");

        if (uom.IsBaseUnit == true)
            throw new BadRequestException("Cannot update a base unit via this endpoint. Use PUT /api/Uoms/{id}/base-unit to update the base unit name.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("UOM name is required.");
        if (name.Length > 255)
            throw new BadRequestException("UOM name cannot exceed 255 characters.");

        var categoryStr = ValidateAndParseCategory(dto.Category);
        if (dto.ConversionRatio <= 0)
            throw new BadRequestException("ConversionRatio must be greater than 0.");

        var baseUnit = await _unitOfWork.Uom.GetBaseUnitByCategoryAsync(categoryStr);
        if (baseUnit == null)
        {
            throw new BadRequestException(
                $"Category '{categoryStr}' does not have a base unit yet. Cannot assign UOM to this category.");
        }

        uom.Name = name;
        uom.Category = categoryStr;
        uom.ConversionRatio = dto.ConversionRatio;

        await _unitOfWork.Uom.UpdateAsync(uom);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(uom);
    }

    public async Task<UomDto> UpdateBaseUnitAsync(int id, UpdateBaseUomDto dto)
    {
        if (dto == null)
            throw new BadRequestException("Request body is required.");

        var uom = await _unitOfWork.Uom.GetByIdAsync(id);
        if (uom == null)
            throw new NotFoundException($"The UOM with ID {id} was not found.");

        if (uom.IsBaseUnit != true)
            throw new BadRequestException($"UOM with ID {id} is not a base unit. Use PUT /api/Uoms/{{id}} to update non-base units.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("UOM name is required.");
        if (name.Length > 255)
            throw new BadRequestException("UOM name cannot exceed 255 characters.");

        uom.Name = name;
        await _unitOfWork.Uom.UpdateAsync(uom);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(uom);
    }

    public async Task<UomDto> UpdateBaseUnitByCategoryAsync(string category, UpdateBaseUomDto dto)
    {
        if (dto == null)
            throw new BadRequestException("Request body is required.");

        var categoryStr = ValidateAndParseCategory(category);

        var uom = await _unitOfWork.Uom.GetBaseUnitByCategoryAsync(categoryStr);
        if (uom == null)
            throw new NotFoundException($"No base unit found for category '{categoryStr}'.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("UOM name is required.");
        if (name.Length > 255)
            throw new BadRequestException("UOM name cannot exceed 255 characters.");

        uom.Name = name;
        await _unitOfWork.Uom.UpdateAsync(uom);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(uom);
    }

    public async Task DeleteAsync(int id)
    {
        var uom = await _unitOfWork.Uom.GetByIdAsync(id);
        if (uom == null)
            throw new NotFoundException($"The UOM with ID {id} was not found.");

        if (uom.IsBaseUnit == true)
            throw new BadRequestException("Cannot delete a base unit.");

        var isUsed = await _unitOfWork.Uom.IsUsedByProductsOrStockTransactionsAsync(id);
        if (isUsed)
        {
            throw new BadRequestException(
                "Cannot delete this UOM because it is being used by products or stock transactions.");
        }

        await _unitOfWork.Uom.DeleteAsync(uom);
        await _unitOfWork.SaveChangesAsync();
    }

    private static string ValidateAndParseCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new BadRequestException("Category is required.");

        if (!Enum.TryParse<UomCategory>(category.Trim(), ignoreCase: true, out var parsedCategory))
        {
            var validValues = string.Join(", ", Enum.GetNames<UomCategory>());
            throw new BadRequestException($"Invalid category '{category}'. Valid values: {validValues}.");
        }

        return parsedCategory.ToString();
    }

    private static UomDto MapToDto(Uom u)
    {
        return new UomDto
        {
            Id = u.Id,
            Name = u.Name,
            Category = u.Category,
            ConversionRatio = u.ConversionRatio,
            IsBaseUnit = u.IsBaseUnit
        };
    }
    public async Task<decimal> ValidateUomAsync(int uomBaseId, int purchaseUomId)
    {
        return await _unitOfWork.Uom.ValidateUomAsync(uomBaseId, purchaseUomId);
    }
}
