using FluentValidation;
using Inventory.Application.DTOs;

namespace Inventory.Application.Validations.SaleOrder;

using Inventory.Application.Validations;

public class UpdateSaleOrderDtoValidator : AbstractValidator<UpdateSaleOrderDto>
{
    public UpdateSaleOrderDtoValidator()
    {
        RuleFor(x => x.CustomerId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.CustomerIdRequired);

        RuleFor(x => x.ToLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ToLocationRequired);
    }
}
