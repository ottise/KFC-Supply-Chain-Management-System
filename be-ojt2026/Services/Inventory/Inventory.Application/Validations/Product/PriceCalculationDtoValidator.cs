using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.Product;

public class PriceCalculationDtoValidator : AbstractValidator<PriceCalculationDto>
{
    public PriceCalculationDtoValidator()
    {
        RuleFor(x => x.StockPrice)
            .MoneyRule();

        RuleFor(x => x.BaseUomId)
            .GreaterThan(0).WithMessage(ValidationRules.BaseUomInvalid);

        RuleFor(x => x.PurchaseUomId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.PurchaseUomInvalid);

        RuleFor(x => x.MarkupPercentage)
            .GreaterThanOrEqualTo(0).WithMessage("Markup percentage cannot be negative.")
            .When(x => x.MarkupPercentage.HasValue);
    }
}
