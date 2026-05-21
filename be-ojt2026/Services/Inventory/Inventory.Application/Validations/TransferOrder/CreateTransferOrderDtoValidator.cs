using FluentValidation;
using Inventory.Application.DTOs;

namespace Inventory.Application.Validations.TransferOrder;

using Inventory.Application.Validations;

public class CreateTransferOrderDtoValidator : AbstractValidator<CreateTransferOrderDto>
{
    public CreateTransferOrderDtoValidator()
    {
        RuleFor(x => x.FromLocationId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.FromLocationRequired);

        RuleFor(x => x.ToLocationId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.ToLocationRequired);

        RuleFor(x => x)
            .Must(x => x.FromLocationId != x.ToLocationId)
            .WithMessage(ValidationRules.FromToDifferent);

        RuleFor(x => x.Items)
            .NotNull()
            .Must(x => x != null && x.Count > 0)
            .WithMessage(ValidationRules.ItemsRequired);

        RuleForEach(x => x.Items)
            .SetValidator(new CreateTransferOrderItemDtoValidator());
    }
}

