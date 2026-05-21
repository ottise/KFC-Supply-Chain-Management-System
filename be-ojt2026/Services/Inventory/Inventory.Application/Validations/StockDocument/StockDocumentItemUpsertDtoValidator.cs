using FluentValidation;
using Inventory.Application.DTOs;

namespace Inventory.Application.Validations.StockDocument;

using Inventory.Application.Validations;

public class StockDocumentItemUpsertDtoValidator : AbstractValidator<StockDocumentItemUpsertDto>
{
    public StockDocumentItemUpsertDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage(ValidationRules.ProductIdInvalid);

        RuleFor(x => x.UomId)
            .GreaterThan(0).WithMessage(ValidationRules.UomIdInvalid);

        RuleFor(x => x.PlannedQty)
            .GreaterThan(0).WithMessage(ValidationRules.PlannedQtyInvalid)
            .Must(v => decimal.Round(v, 3, MidpointRounding.AwayFromZero) == v)
            .WithMessage(ValidationRules.QtyScaleInvalid)
            .Must(v => Math.Abs(v) <= ValidationRules.MaxQtyValue)
            .WithMessage(ValidationRules.QtyPrecisionInvalid);

        RuleFor(x => x.LotId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.LotIdInvalid);

        RuleFor(x => x.FromLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ItemFromLocationIdInvalid);

        RuleFor(x => x.ToLocationId)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage(ValidationRules.ItemToLocationIdInvalid);
    }
}
