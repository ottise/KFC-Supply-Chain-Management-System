using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.SaleOrder;

public class SaleOrderItemUpsertDtoValidator : AbstractValidator<SaleOrderItemUpsertDto>
{
    public SaleOrderItemUpsertDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.ProductIdRequired);

        RuleFor(x => x.OrderedQty)
            .GreaterThan(0)
            .WithMessage(ValidationRules.OrderedQtyRequired)
            .MoneyRule();

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage(ValidationRules.UnitPriceRequired)
            .MoneyRule();
    }
}
