using FluentValidation;
using Inventory.Application.DTOs;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.TransferOrder;

public class UpdateTransferOrderDtoValidator : AbstractValidator<UpdateTransferOrderDto>
{
    public UpdateTransferOrderDtoValidator()
    {
        RuleFor(x => x.FromLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.FromLocationRequired);

        RuleFor(x => x.ToLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ToLocationRequired);

        RuleFor(x => x)
            .Must(x => !x.FromLocationId.HasValue || !x.ToLocationId.HasValue || x.FromLocationId.Value != x.ToLocationId.Value)
            .WithMessage(ValidationRules.FromToDifferent);
    }
}
