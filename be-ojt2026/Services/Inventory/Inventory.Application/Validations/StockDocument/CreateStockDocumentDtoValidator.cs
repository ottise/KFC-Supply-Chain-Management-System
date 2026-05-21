using FluentValidation;
using Inventory.Application.DTOs;

namespace Inventory.Application.Validations.StockDocument;

using Inventory.Application.Validations;

public class CreateStockDocumentDtoValidator : AbstractValidator<CreateStockDocumentDto>
{
    public CreateStockDocumentDtoValidator()
    {
        RuleFor(x => x.DocumentType)
            .NotEmpty().WithMessage(ValidationRules.DocumentTypeRequired)
            .MaximumLength(ValidationRules.MaxTextLength).WithMessage(ValidationRules.DocumentTypeMaxLength)
            .Must(v => ValidationRules.AllowedDocumentTypes.Contains(v))
            .WithMessage(ValidationRules.DocumentTypeInvalid);

        RuleFor(x => x.ReferenceType)
            .MaximumLength(ValidationRules.MaxTextLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ReferenceType))
            .WithMessage(ValidationRules.ReferenceTypeMaxLength);

        RuleFor(x => x.ReferenceId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ReferenceIdInvalid);

        RuleFor(x => x.Origin)
            .MaximumLength(ValidationRules.MaxTextLength)
            .When(x => !string.IsNullOrWhiteSpace(x.Origin))
            .WithMessage(ValidationRules.OriginMaxLength);

        RuleFor(x => x.FromLocationId)
            .GreaterThan(0).WithMessage(ValidationRules.FromLocationIdInvalid);

        RuleFor(x => x.ToLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ToLocationIdInvalid);

        RuleForEach(x => x.Items)
            .SetValidator(new StockDocumentItemUpsertDtoValidator());

        RuleFor(x => x.Items)
            .Must(items => items == null || items.Count <= 320)
            .WithMessage("A stock document cannot have more than 320 items.");
    }
}
