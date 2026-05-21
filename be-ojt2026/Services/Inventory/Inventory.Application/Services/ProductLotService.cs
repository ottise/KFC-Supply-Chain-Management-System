using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services;

public class ProductLotService : IProductLotService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductLotService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ProductLotDto>> GetAllAsync()
    {
        var lots = (await _unitOfWork.ProductLot.GetAllAsync()).ToList();
        var lotIds = lots.Select(l => l.Id).ToList();
        var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLotIdsAsync(lotIds);

        return lots.Select(lot =>
        {
            var dto = MapToDto(lot);
            var lotInventories = inventories.Where(i => i.LotId == lot.Id && i.Location != null).ToList();
            if (lotInventories.Count > 0)
            {
                dto.Locations = lotInventories.Select(i => new LotLocationDto
                {
                    LocationId = i.Location!.Id,
                    LocationName = i.Location!.Name,
                    Quantity = i.Quantity ?? 0
                }).ToList();
            }
            return dto;
        }).ToList();
    }

    public async Task<PagedResultDto<ProductLotDto>> GetPaginatedAsync(
        int page,
        int pageSize,
        string? lotNumber = null,
        DateTime? expirationDateFrom = null,
        DateTime? expirationDateTo = null)
    {
        if (page < 1)
            throw new BadRequestException("Page must be greater than 0.");
        if (pageSize < 1 || pageSize > 100)
            throw new BadRequestException("PageSize must be between 1 and 100.");

        var (items, totalCount) = await _unitOfWork.ProductLot.GetPaginatedAsync(
            page, pageSize, lotNumber, expirationDateFrom, expirationDateTo);

        var itemList = items.ToList();
        var lotIds = itemList.Select(x => x.Id).ToList();
        var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLotIdsAsync(lotIds);

        var data = itemList.Select(lot =>
        {
            var dto = MapToDto(lot);
            var lotInventories = inventories.Where(i => i.LotId == lot.Id && i.Location != null).ToList();
            if (lotInventories.Count > 0)
            {
                dto.Locations = lotInventories.Select(i => new LotLocationDto
                {
                    LocationId = i.Location!.Id,
                    LocationName = i.Location!.Name,
                    Quantity = i.Quantity ?? 0
                }).ToList();
            }
            return dto;
        }).ToList();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<ProductLotDto>
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

    public async Task<ProductLotDto?> GetByIdAsync(int id)
    {
        var lot = await _unitOfWork.ProductLot.GetByIdAsync(id);
        if (lot == null) return null;

        var dto = MapToDto(lot);
        var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLotIdAsync(id);
        if (inventories != null && inventories.Count > 0)
        {
            dto.Locations = inventories.Where(i => i.Location != null).Select(i => new LotLocationDto
            {
                LocationId = i.Location.Id,
                LocationName = i.Location.Name,
                Quantity = i.Quantity ?? 0
            }).ToList();
        }

        return dto;
    }

    public async Task<PagedResultDto<ProductLotDto>> SearchAsync(int page, int pageSize, string? keyword, int? productId, int? managerId, int? locationId, DateTime? expirationDateBefore, DateTime? expirationDateAfter, int? expiresWithinDays)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var (items, totalCount) = await _unitOfWork.ProductLot.SearchAsync(page, pageSize, keyword, productId, managerId, locationId, expirationDateBefore, expirationDateAfter, expiresWithinDays);

        var itemList = items.ToList();
        var lotIds = itemList.Select(l => l.Id).ToList();
        var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLotIdsAsync(lotIds);

        var data = itemList.Select(lot =>
        {
            var dto = MapToDto(lot);
            var lotInventories = inventories.Where(i => i.LotId == lot.Id && i.Location != null).ToList();
            if (lotInventories.Count > 0)
            {
                dto.Locations = lotInventories.Select(i => new LotLocationDto
                {
                    LocationId = i.Location!.Id,
                    LocationName = i.Location!.Name,
                    Quantity = i.Quantity ?? 0
                }).ToList();
            }
            return dto;
        }).ToList();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<ProductLotDto>
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

    public async Task<ProductLot?> GetProductLotByLotIdAndProductId(int productId, int lotId)
    {
        if (productId <= 0) throw new ArgumentException("Invalid product id");
        if (lotId <= 0) throw new ArgumentException("Invalid lot id");
        return await _unitOfWork.ProductLot.GetProductLotByLotIdAndProductId(productId, lotId);
    }

    public async Task<ProductLot> CreateProductLot(ProductLot productLot)
    {
        if (productLot == null) throw new ArgumentNullException(nameof(productLot));
        if (productLot.ProductId <= 0) throw new ArgumentException("Invalid product id");
        await _unitOfWork.ProductLot.CreateProductLot(productLot);
        await _unitOfWork.SaveChangesAsync();
        return productLot;
    }

    public async Task<ProductLotDto> CreateAsync(CreateProductLotDto dto)
    {
        var lotNumber = dto.LotNumber?.Trim();
        if (string.IsNullOrWhiteSpace(lotNumber) || lotNumber.Length > 255)
            throw new BadRequestException("LotNumber is required and must not exceed 255 characters.");

        if (dto.ProductId <= 0)
            throw new BadRequestException("ProductId must be greater than 0.");

        var product = await _unitOfWork.Product.GetByIdAsync(dto.ProductId);
        if (product == null)
            throw new NotFoundException($"Product with ID {dto.ProductId} was not found.");

        var existingSameProduct = await _unitOfWork.ProductLot.GetAllAsync();
        var duplicateLot = existingSameProduct.Any(pl =>
            pl.ProductId == dto.ProductId &&
            pl.LotNumber != null &&
            pl.LotNumber.Equals(lotNumber, StringComparison.OrdinalIgnoreCase));
        if (duplicateLot)
            throw new ConflictException($"A lot with number '{lotNumber}' already exists for this product.");

        var lot = new ProductLot
        {
            ProductId = dto.ProductId,
            LotNumber = lotNumber,
            ExpirationDate = dto.ExpirationDate
        };
        await _unitOfWork.ProductLot.CreateProductLot(lot);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(lot);
    }

    public async Task<ProductLotDto> UpdateAsync(int id, CreateProductLotDto dto)
    {
        var lot = await _unitOfWork.ProductLot.GetByIdAsync(id);
        if (lot == null)
            throw new NotFoundException($"Product lot with ID {id} was not found.");

        var lotNumber = dto.LotNumber?.Trim();
        if (string.IsNullOrWhiteSpace(lotNumber) || lotNumber.Length > 255)
            throw new BadRequestException("LotNumber is required and must not exceed 255 characters.");

        if (dto.ProductId <= 0)
            throw new BadRequestException("ProductId must be greater than 0.");

        var product = await _unitOfWork.Product.GetByIdAsync(dto.ProductId);
        if (product == null)
            throw new NotFoundException($"Product with ID {dto.ProductId} was not found.");

        var existingSameProduct = await _unitOfWork.ProductLot.GetAllAsync();
        var duplicateLot = existingSameProduct.Any(pl =>
            pl.Id != id &&
            pl.ProductId == dto.ProductId &&
            pl.LotNumber != null &&
            pl.LotNumber.Equals(lotNumber, StringComparison.OrdinalIgnoreCase));
        if (duplicateLot)
            throw new ConflictException($"A lot with number '{lotNumber}' already exists for this product.");

        lot.ProductId = dto.ProductId;
        lot.LotNumber = lotNumber;
        lot.ExpirationDate = dto.ExpirationDate;

        await _unitOfWork.ProductLot.UpdateAsync(lot);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(lot);
    }

    public async Task DeleteAsync(int id)
    {
        var lot = await _unitOfWork.ProductLot.GetByIdAsync(id);
        if (lot == null)
            throw new NotFoundException($"Product lot with ID {id} was not found.");

        var inUse = await _unitOfWork.ProductLot.IsLotReferencedAsync(id);
        if (inUse)
            throw new BadRequestException("Cannot delete this lot because it is referenced by inventory, scrap orders, adjustments, or stock transactions.");

        await _unitOfWork.ProductLot.DeleteAsync(lot);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<bool> IsLotReferencedAsync(int id)
    {
        return await _unitOfWork.ProductLot.IsLotReferencedAsync(id);
    }

    private static ProductLotDto MapToDto(ProductLot pl)
    {
        return new ProductLotDto
        {
            Id = pl.Id,
            ProductId = pl.ProductId,
            ProductName = pl.Product?.Name,
            ProductCode = pl.Product?.Code,
            LotNumber = pl.LotNumber,
            ExpirationDate = pl.ExpirationDate
        };
    }

    public async Task<IEnumerable<ProductLotDto>> GetByLocationIdAsync(int locationId)
    {
        var lots = (await _unitOfWork.ProductLot.GetLotsByLocationIdAsync(locationId)).ToList();
        if (!lots.Any()) return new List<ProductLotDto>();

        var lotIds = lots.Select(l => l.Id).ToList();
        var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLotIdsAsync(lotIds);

        return lots.Select(lot =>
        {
            var dto = MapToDto(lot);
            var lotInventories = inventories.Where(i => i.LotId == lot.Id && i.Location != null).ToList();
            if (lotInventories.Count > 0)
            {
                dto.Locations = lotInventories.Select(i => new LotLocationDto
                {
                    LocationId = i.Location!.Id,
                    LocationName = i.Location!.Name,
                    Quantity = i.Quantity ?? 0
                }).ToList();
            }
            return dto;
        }).ToList();
    }

    public async Task<IEnumerable<ProductLotDto>> GetByLocationAndProductAsync(int locationId, int productId)
    {
        if (locationId <= 0)
            throw new BadRequestException("locationId must be greater than 0.");

        if (productId <= 0)
            throw new BadRequestException("productId must be greater than 0.");

        var lots = (await _unitOfWork.ProductLot.GetLotsByLocationAndProductAsync(locationId, productId)).ToList();
        if (!lots.Any()) return new List<ProductLotDto>();

        var lotIds = lots.Select(l => l.Id).ToList();
        var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLotIdsAsync(lotIds);

        return lots.Select(lot =>
        {
            var dto = MapToDto(lot);
            var lotInventories = inventories.Where(i => i.LotId == lot.Id && i.Location != null).ToList();
            if (lotInventories.Count > 0)
            {
                dto.Locations = lotInventories.Select(i => new LotLocationDto
                {
                    LocationId = i.Location!.Id,
                    LocationName = i.Location!.Name,
                    Quantity = i.Quantity ?? 0
                }).ToList();
            }
            return dto;
        }).ToList();
    }
}
