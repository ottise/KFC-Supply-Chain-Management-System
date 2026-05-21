using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.TransferOrder;

public class TransferOrderItemUpsertDtoValidator : AbstractValidator<TransferOrderItemUpsertDto>
{
    public TransferOrderItemUpsertDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.ProductIdRequired);

        RuleFor(x => x.RequestedQty)
            .GreaterThan(0)
            .WithMessage(ValidationRules.RequestedQtyRequired)
            .QuantityRule();
    }
}
