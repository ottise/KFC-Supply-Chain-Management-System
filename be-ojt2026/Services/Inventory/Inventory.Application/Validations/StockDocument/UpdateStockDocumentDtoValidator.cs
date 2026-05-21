using FluentValidation;
using Inventory.Application.DTOs;

namespace Inventory.Application.Validations.StockDocument;

using Inventory.Application.Validations;

public class UpdateStockDocumentDtoValidator : AbstractValidator<UpdateStockDocumentDto>
{
    public UpdateStockDocumentDtoValidator()
    {
        RuleFor(x => x.ReferenceType)
            .MaximumLength(ValidationRules.MaxTextLength)
            .When(x => x.ReferenceType is not null && !string.IsNullOrWhiteSpace(x.ReferenceType))
            .WithMessage(ValidationRules.ReferenceTypeMaxLength);

        RuleFor(x => x.ReferenceId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ReferenceIdInvalid);

        RuleFor(x => x.Origin)
            .MaximumLength(ValidationRules.MaxTextLength)
            .When(x => x.Origin is not null && !string.IsNullOrWhiteSpace(x.Origin))
            .WithMessage(ValidationRules.OriginMaxLength);

        RuleFor(x => x.FromLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.FromLocationIdInvalid);

        RuleFor(x => x.ToLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ToLocationIdInvalid);
    }
}
