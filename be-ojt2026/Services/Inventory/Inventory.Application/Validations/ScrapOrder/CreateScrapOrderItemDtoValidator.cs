using FluentValidation;
using Inventory.Application.DTOs.ScrapOrder;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.ScrapOrder;

public class CreateScrapOrderItemDtoValidator : AbstractValidator<CreateScrapOrderItemDto>
{
    public CreateScrapOrderItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.ProductIdRequired);

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage(ValidationRules.QuantityRequired)
            .QuantityRule();

        RuleFor(x => x.UomId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.UomIdInvalid);

        RuleFor(x => x.LotId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.LotIdInvalid);

        RuleFor(x => x.Reason)
            .MaximumLength(ValidationRules.MaxTextLength)
            .WithMessage(ValidationRules.ReasonMaxLength);
    }
}
