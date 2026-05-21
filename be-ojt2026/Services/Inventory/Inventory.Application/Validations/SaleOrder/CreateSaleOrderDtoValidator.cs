using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.SaleOrder;

public class CreateSaleOrderDtoValidator : AbstractValidator<CreateSaleOrderDto>
{
    public CreateSaleOrderDtoValidator()
    {
        RuleFor(x => x.CustomerId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.CustomerIdRequired);

        RuleFor(x => x.Items)
            .NotNull()
            .Must(x => x != null && x.Count > 0)
            .WithMessage(ValidationRules.ItemsRequired);

        RuleFor(x => x.ToLocationId)
            .NotNull()
            .WithMessage(ValidationRules.ToLocationRequired);

        RuleForEach(x => x.Items)
            .SetValidator(new CreateSaleOrderItemDtoValidator());
    }
}

