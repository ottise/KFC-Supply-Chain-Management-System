using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;
using Inventory.Domain.Common.Constants;

namespace Inventory.Application.Validations.Product;

public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationRules.NameRequired)
            .MaximumLength(ValidationRules.MaxTextLength).WithMessage(ValidationRules.NameMaxLength);

        RuleFor(x => x.ProductType)
            .NotEmpty().WithMessage("ProductType is required.")
            .Must(v => ProductTypeCode.IsValid(v))
            .WithMessage($"ProductType must be one of: {string.Join(", ", ProductTypeCode.AllowedTypes)}.");

        RuleFor(x => x.BaseUomId)
            .GreaterThan(0).WithMessage(ValidationRules.BaseUomInvalid);

        RuleFor(x => x.PurchaseUomId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.PurchaseUomInvalid);

        RuleFor(x => x.CategoryId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.CategoryInvalid);

        RuleFor(x => x.StockPrice)
            .MoneyRule();

        RuleFor(x => x.SalePrice)
            .MoneyRule();
    }
}
