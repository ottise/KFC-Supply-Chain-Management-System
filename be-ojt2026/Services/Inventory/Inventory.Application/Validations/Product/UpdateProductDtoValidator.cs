using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;
using Inventory.Domain.Common.Constants;

namespace Inventory.Application.Validations.Product;

public class UpdateProductDtoValidator : AbstractValidator<UpdateProductDto>
{
    public UpdateProductDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationRules.NameRequired)
            .MaximumLength(ValidationRules.MaxTextLength).WithMessage(ValidationRules.NameMaxLength)
            .When(x => x.Name is not null);

        RuleFor(x => x.ProductType)
            .Must(v => ProductTypeCode.IsValid(v))
            .WithMessage($"ProductType must be one of: {string.Join(", ", ProductTypeCode.AllowedTypes)}.")
            .When(x => x.ProductType is not null);

        RuleFor(x => x.BaseUomId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.BaseUomInvalid);

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
