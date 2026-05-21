using FluentValidation;
using Inventory.Application.DTOs.ScrapOrder;
using Inventory.Application.Validations;

namespace Inventory.Application.Validations.ScrapOrder;

public class CreateScrapOrderDtoValidator : AbstractValidator<CreateScrapOrderDto>
{
    public CreateScrapOrderDtoValidator()
    {
        RuleFor(x => x.WarehouseId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.WarehouseIdRequired);

        RuleFor(x => x.LocationId)
            .GreaterThan(0)
            .WithMessage(ValidationRules.LocationIdRequired);

        RuleFor(x => x.Item)
            .NotNull()
            .WithMessage(ValidationRules.ItemsRequired)
            .SetValidator(new CreateScrapOrderItemDtoValidator());
    }
}
