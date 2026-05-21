using BuildingBlocks.Exceptions;
using BuildingBlocks.Utils;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using System.Globalization;
using System.Text;

namespace Inventory.Application.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<ProductDto>> GetAllAsync(
        string? search = null,
        string? searchField = null,
        bool? isActive = null,
        int? categoryId = null,
        int page = 1,
        int pageSize = 5)
    {
        var rawProducts = await _unitOfWork.Product.GetAllAsync();
        var query = rawProducts.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = TextNormalizer.NormalizeForSearch(search);

            if (string.Equals(searchField, "code", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => TextNormalizer.NormalizeForSearch(p.Code).Contains(normalizedSearch, StringComparison.Ordinal));
            }
            else if (string.Equals(searchField, "name", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => TextNormalizer.NormalizeForSearch(p.Name).Contains(normalizedSearch, StringComparison.Ordinal));
            }
            else
            {
                query = query.Where(p =>
                    TextNormalizer.NormalizeForSearch(p.Name).Contains(normalizedSearch, StringComparison.Ordinal)
                    || TextNormalizer.NormalizeForSearch(p.Code).Contains(normalizedSearch, StringComparison.Ordinal)
                    || (p.Category != null && TextNormalizer.NormalizeForSearch(p.Category.Name).Contains(normalizedSearch, StringComparison.Ordinal)));
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
            .Select(MapToDto)
            .ToList();

        return new PagedResultDto<ProductDto>
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

    public async Task<IEnumerable<ProductDto>> GetByLocationIdAsync(int locationId)
    {
        if (locationId <= 0)
            throw new BadRequestException("locationId must be greater than 0.");

        var products = await _unitOfWork.Product.GetByLocationIdAsync(locationId);
        return products.Select(MapToDto).ToList();
    }

    public async Task<ProductDto> GetByIdAsync(int id)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(id);
        if (product == null)
            throw new NotFoundException($"Product with ID {id} was not found.");

        return MapToDto(product);
    }

    public async Task<ProductDto> GetByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BadRequestException("Product code is required.");

        var normalizedCode = code.Trim();
        var product = await _unitOfWork.Product.GetByCodeAsync(normalizedCode);
        if (product == null)
            throw new NotFoundException($"Product with code '{normalizedCode}' was not found.");

        return MapToDto(product);
    }

    public async Task CreateAsync(CreateProductDto dto)
    {
        dto.Name = NormalizeRequiredText(dto.Name, nameof(dto.Name));

        // Validate and normalize ProductType
        var productType = NormalizeProductType(dto.ProductType);

        // Validate BaseUomId exists (this is the sale UOM)
        await EnsureBaseUomExists(dto.BaseUomId);

        // Validate PurchaseUomId if provided (this is the stock UOM)
        if (dto.PurchaseUomId.HasValue)
            await EnsurePurchaseUomExists(dto.PurchaseUomId.Value);

        // Validate CategoryId if provided
        string? categoryCode = null;
        if (dto.CategoryId.HasValue)
        {
            var category = await EnsureCategoryExistsAndGet(dto.CategoryId.Value);
            categoryCode = CategoryCode.GetCode(category.Name);
            if (categoryCode == null)
                throw new BadRequestException($"Category '{category.Name}' is not supported for code generation.");
        }
        else
        {
            throw new BadRequestException("CategoryId is required for auto-generating product code.");
        }

        // Validate money precision
        EnsureMoneyFitsDatabase(dto.StockPrice, nameof(dto.StockPrice));
        EnsureMoneyFitsDatabase(dto.SalePrice, nameof(dto.SalePrice));

        // CRITICAL VALIDATION: SalePrice >= StockPrice (with conversion)
        await EnsureSalePriceIsValidAsync(dto.SalePrice, dto.StockPrice, dto.BaseUomId, dto.PurchaseUomId);

        // Auto-generate code: KFC-[ProductType]-[Category]-[Initials]-[random 4 digits]
        var typeCode = ProductTypeCode.GetCode(productType) ?? "UNK";
        var initials = GetInitials(dto.Name);
        string code;
        while (true)
        {
            var rnd = Random.Shared.Next(1000, 10000); // 1000 to 9999
            code = $"KFC-{typeCode}-{categoryCode}-{initials}-{rnd}";
            var existing = await _unitOfWork.Product.GetByCodeAsync(code);
            if (existing == null) break;
        }

        var product = new Product
        {
            Name = dto.Name,
            Code = code,
            ProductType = productType,
            BaseUomId = dto.BaseUomId,
            PurchaseUomId = dto.PurchaseUomId,
            CategoryId = dto.CategoryId,
            SalePrice = dto.SalePrice,
            StockPrice = dto.StockPrice,
            IsActive = ToIsActive(ProductStatus.Active),
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Product.AddAsync(product);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(id);
        if (product == null)
            throw new NotFoundException($"Product with ID {id} was not found.");

        if (dto.Name is not null)
        {
            dto.Name = NormalizeRequiredText(dto.Name, nameof(dto.Name));
            product.Name = dto.Name;
        }

        if (dto.ProductType is not null)
        {
            var normalizedType = NormalizeProductType(dto.ProductType);
            product.ProductType = normalizedType;
        }

        if (dto.BaseUomId.HasValue)
        {
            await EnsureBaseUomExists(dto.BaseUomId.Value);
            product.BaseUomId = dto.BaseUomId.Value;
        }

        if (dto.PurchaseUomId.HasValue)
        {
            await EnsurePurchaseUomExists(dto.PurchaseUomId.Value);
            product.PurchaseUomId = dto.PurchaseUomId;
        }

        if (dto.CategoryId.HasValue)
        {
            await EnsureCategoryExistsAndGet(dto.CategoryId.Value);
            product.CategoryId = dto.CategoryId;
        }

        if (dto.StockPrice.HasValue)
        {
            EnsureMoneyFitsDatabase(dto.StockPrice, nameof(dto.StockPrice));
            product.StockPrice = dto.StockPrice.Value;
        }

        if (dto.SalePrice.HasValue)
        {
            EnsureMoneyFitsDatabase(dto.SalePrice, nameof(dto.SalePrice));
            product.SalePrice = dto.SalePrice.Value;
        }

        // Validate SalePrice >= StockPrice after all updates
        if (product.SalePrice.HasValue && product.StockPrice.HasValue)
        {
            await EnsureSalePriceIsValidAsync(product.SalePrice.Value, product.StockPrice.Value, product.BaseUomId, product.PurchaseUomId);
        }

        if (dto.IsActive.HasValue)
            product.IsActive = dto.IsActive.Value;

        // Re-generate code if ProductType or CategoryId changed
        if (dto.ProductType is not null || dto.CategoryId.HasValue)
        {
            var effectiveType = product.ProductType;
            if (string.IsNullOrWhiteSpace(effectiveType))
                throw new BadRequestException("ProductType is required for code generation.");

            if (!product.CategoryId.HasValue)
                throw new BadRequestException("CategoryId is required for code generation.");

            var cat = await EnsureCategoryExistsAndGet(product.CategoryId.Value);
            var catCode = CategoryCode.GetCode(cat.Name);
            if (catCode == null)
                throw new BadRequestException($"Category '{cat.Name}' is not supported for code generation.");

            var typeCode = ProductTypeCode.GetCode(effectiveType) ?? "UNK";
            var initials = GetInitials(product.Name);
            
            string code;
            while (true)
            {
                var rnd = Random.Shared.Next(1000, 10000);
                code = $"KFC-{typeCode}-{catCode}-{initials}-{rnd}";
                var existing = await _unitOfWork.Product.GetByCodeAsync(code);
                // Be careful, if it matches the current product itself, it's fine, but just checking if any other product has it:
                if (existing == null || existing.Id == product.Id) break;
            }
            product.Code = code;
        }

        product.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Product.Update(product);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task SoftDeleteAsync(int id)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(id);
        if (product == null)
            throw new NotFoundException($"Product with ID {id} was not found.");

        if (product.IsActive == ToIsActive(ProductStatus.Archived))
            throw new BadRequestException($"Product with ID {id} is already archived.");

        product.IsActive = ToIsActive(ProductStatus.Archived);
        product.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Product.Update(product);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RestoreAsync(int id)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(id);
        if (product == null)
            throw new NotFoundException($"Product with ID {id} was not found.");

        if (product.IsActive == ToIsActive(ProductStatus.Active))
            throw new BadRequestException($"Product with ID {id} is already active.");

        product.IsActive = ToIsActive(ProductStatus.Active);
        product.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Product.Update(product);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PriceCalculationResponseDto> CalculatePriceAsync(PriceCalculationDto dto)
    {
        decimal convertedStockPrice;
        if (!dto.PurchaseUomId.HasValue || dto.PurchaseUomId.Value == dto.BaseUomId)
        {
            convertedStockPrice = dto.StockPrice;
        }
        else
        {
            convertedStockPrice = await GetConvertedStockPrice(dto.StockPrice, dto.BaseUomId, dto.PurchaseUomId.Value);
        }

        var multiplier = dto.MarkupPercentage.HasValue 
            ? 1 + (dto.MarkupPercentage.Value / 100m) 
            : 1.3m;

        var suggestedPrice = convertedStockPrice * multiplier;
        
        return new PriceCalculationResponseDto
        {
            SuggestedSalePrice = decimal.Round(suggestedPrice, 2, MidpointRounding.AwayFromZero)
        };
    }

    // ────────────────── Private helpers ──────────────────

    private static string NormalizeProductType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new BadRequestException("ProductType is required.");

        var normalized = value.Trim();
        var match = ProductTypeCode.AllowedTypes.FirstOrDefault(t => t.Equals(normalized, StringComparison.OrdinalIgnoreCase));
        if (match == null)
            throw new BadRequestException($"ProductType must be one of: {string.Join(", ", ProductTypeCode.AllowedTypes)}.");

        return match;
    }

    private async Task EnsureSalePriceIsValidAsync(decimal salePrice, decimal stockPrice, int baseUomId, int? purchaseUomId)
    {
        decimal convertedStockPrice;
        if (!purchaseUomId.HasValue || purchaseUomId.Value == baseUomId)
        {
            convertedStockPrice = stockPrice;
        }
        else
        {
            convertedStockPrice = await GetConvertedStockPrice(stockPrice, baseUomId, purchaseUomId.Value);
        }

        if (salePrice < convertedStockPrice)
        {
            throw new BadRequestException($"Sale price ({salePrice}) must be greater than or equal to stock price per base unit ({decimal.Round(convertedStockPrice, 2)}).");
        }
    }

    private async Task EnsureBaseUomExists(int baseUomId)
    {
        var baseUom = await _unitOfWork.Uom.GetByIdAsync(baseUomId);
        if (baseUom == null)
            throw new NotFoundException($"Base UOM with ID {baseUomId} was not found.");
    }

    private async Task EnsurePurchaseUomExists(int purchaseUomId)
    {
        var purchaseUom = await _unitOfWork.Uom.GetByIdAsync(purchaseUomId);
        if (purchaseUom == null)
            throw new NotFoundException($"Purchase UOM with ID {purchaseUomId} was not found.");
    }

    private async Task<Category> EnsureCategoryExistsAndGet(int categoryId)
    {
        var category = await _unitOfWork.Category.GetCategoryByIdAsync(categoryId);
        if (category == null)
            throw new NotFoundException($"Category with ID {categoryId} was not found.");
        return category;
    }

    private static string GetInitials(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "XXX";

        // Remove diacritics/accents
        var normalizedString = name.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        var noDiacritics = stringBuilder.ToString().Normalize(NormalizationForm.FormC);

        // Extract initials
        var words = noDiacritics.Split(new[] { ' ', '-', '_', '.', ',' }, StringSplitOptions.RemoveEmptyEntries);
        var initials = words
            .Where(w => char.IsLetterOrDigit(w[0]))
            .Select(w => char.ToUpper(w[0]))
            .ToArray();

        return initials.Length > 0 ? new string(initials) : "PROD";
    }

    private async Task<decimal> GetConvertedStockPrice(decimal stockPrice, int baseUomId, int purchaseUomId)
    {
        var baseUom = await _unitOfWork.Uom.GetByIdAsync(baseUomId);
        var purchaseUom = await _unitOfWork.Uom.GetByIdAsync(purchaseUomId);

        if (baseUom == null)
            throw new NotFoundException($"Base UOM with ID {baseUomId} was not found.");
        if (purchaseUom == null)
            throw new NotFoundException($"Purchase UOM with ID {purchaseUomId} was not found.");

        if (baseUom.Category != purchaseUom.Category)
            throw new BadRequestException($"Base UOM ({baseUom.Name}) and Purchase UOM ({purchaseUom.Name}) must belong to the same category.");

        decimal baseRatio = baseUom.ConversionRatio ?? 1m;
        decimal purchaseRatio = purchaseUom.ConversionRatio ?? 1m;

        if (baseRatio <= 0) baseRatio = 1m;
        if (purchaseRatio <= 0) purchaseRatio = 1m;

        // ratio = how many baseUom in one purchaseUom
        // e.g. Base="Cái"(1), Purchase="Thùng"(24) => ratio = 24/1 = 24.
        decimal ratio = purchaseRatio / baseRatio;
        return stockPrice / ratio;
    }

    private static string NormalizeRequiredText(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new BadRequestException($"{fieldName} is required.");

        var normalized = value.Trim();
        if (normalized.Length > 255)
            throw new BadRequestException($"{fieldName} must not exceed 255 characters.");

        return normalized;
    }

    private static void EnsureMoneyFitsDatabase(decimal? value, string fieldName)
    {
        if (!value.HasValue)
            return;

        if (value.Value < 0)
            throw new BadRequestException($"{fieldName} cannot be negative.");

        var rounded = decimal.Round(value.Value, 2, MidpointRounding.AwayFromZero);
        if (rounded != value.Value)
            throw new BadRequestException($"{fieldName} supports up to 2 decimal places.");

        const decimal max = 9999999999999999.99m;
        if (Math.Abs(value.Value) > max)
            throw new BadRequestException($"{fieldName} exceeds database precision decimal(18,2).");
    }

    private static ProductDto MapToDto(Product p)
    {
        return new ProductDto
        {
            Id = p.Id,
            Name = p.Name,
            Code = p.Code,
            ProductType = p.ProductType,
            BaseUomId = p.BaseUomId,
            BaseUomName = p.BaseUom?.Name,
            PurchaseUomId = p.PurchaseUomId,
            PurchaseUomName = p.PurchaseUom?.Name,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name,
            SalePrice = p.SalePrice,
            StockPrice = p.StockPrice,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }

    private static bool ToIsActive(ProductStatus status)
    {
        return status == ProductStatus.Active;
    }
}
