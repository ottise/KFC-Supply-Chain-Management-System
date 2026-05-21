using FluentValidation;

namespace Inventory.Application.Validations;

public static class ValidationRules
{
    public const int MaxTextLength = 255;
    public const decimal MaxMoneyValue = 9999999999999999.99m;
    public const decimal MaxQtyValue = 999_999_999_999_999.999m;

    public const string NameRequired = "Name is required.";
    public const string NameMaxLength = "Name must not exceed 255 characters.";
    public const string CodeRequired = "Code is required.";
    public const string CodeMaxLength = "Code must not exceed 255 characters.";
    public const string ProductTypeMaxLength = "ProductType must not exceed 255 characters.";

    public const string BaseUomInvalid = "BaseUomId must be greater than 0.";
    public const string PurchaseUomInvalid = "PurchaseUomId must be greater than 0 when provided.";
    public const string CategoryInvalid = "CategoryId must be greater than 0 when provided.";

    public const string CustomerIdRequired = "CustomerId is required and must be greater than 0.";
    public const string ItemsRequired = "At least one item is required.";
    public const string ProductIdRequired = "ProductId is required and must be greater than 0.";
    public const string ProductIdInvalid = "ProductId must be greater than 0.";
    public const string OrderedQtyRequired = "OrderedQty must be greater than 0.";
    public const string UnitPriceRequired = "UnitPrice must be greater than or equal to 0.";

    public const string FromLocationRequired = "FromLocationId is required and must be greater than 0.";
    public const string ToLocationRequired = "ToLocationId is required and must be greater than 0.";
    public const string FromToDifferent = "FromLocation and ToLocation must be different.";
    public const string RequestedQtyRequired = "RequestedQty must be greater than 0.";
    public const string WarehouseIdRequired = "WarehouseId is required and must be greater than 0.";
    public const string LocationIdRequired = "LocationId is required and must be greater than 0.";
    public const string QuantityRequired = "Quantity must be greater than 0.";
    public const string ReasonMaxLength = "Reason must not exceed 255 characters.";

    public const string DocumentTypeRequired = "DocumentType is required.";
    public const string DocumentTypeMaxLength = "DocumentType must not exceed 255 characters.";
    public const string DocumentTypeInvalid = "DocumentType must be 'delivery' or 'transfer'.";
    public const string ReferenceTypeMaxLength = "ReferenceType must not exceed 255 characters.";
    public const string ReferenceIdInvalid = "ReferenceId must be greater than 0 when provided.";
    public const string OriginMaxLength = "Origin must not exceed 255 characters.";
    public const string FromLocationIdInvalid = "FromLocationId must be greater than 0.";
    public const string ToLocationIdInvalid = "ToLocationId must be greater than 0 when provided.";
    public const string UomIdInvalid = "UomId must be greater than 0.";
    public const string PlannedQtyInvalid = "PlannedQty must be greater than 0.";
    public const string LotIdInvalid = "LotId must be greater than 0 when provided.";
    public const string ItemFromLocationIdInvalid = "FromLocationId must be greater than 0 when provided.";
    public const string ItemToLocationIdInvalid = "ToLocationId must be greater than 0 when provided.";

    public const string MoneyNegativeInvalid = "{PropertyName} cannot be negative.";
    public const string MoneyScaleInvalid = "{PropertyName} supports up to 2 decimal places.";
    public const string MoneyPrecisionInvalid = "{PropertyName} exceeds database precision decimal(18,2).";

    public const string QtyScaleInvalid = "Quantity must not have more than 3 decimal places.";
    public const string QtyPrecisionInvalid = "Quantity exceeds the maximum allowed value.";

    public static readonly string[] AllowedDocumentTypes = { "delivery", "transfer" };

    public static IRuleBuilderOptions<T, decimal?> MoneyRule<T>(this IRuleBuilder<T, decimal?> rule)
    {
        return rule
            .Must(value => !value.HasValue || value.Value >= 0)
            .WithMessage(MoneyNegativeInvalid)
            .Must(value => !value.HasValue || decimal.Round(value.Value, 2, MidpointRounding.AwayFromZero) == value.Value)
            .WithMessage(MoneyScaleInvalid)
            .Must(value => !value.HasValue || Math.Abs(value.Value) <= MaxMoneyValue)
            .WithMessage(MoneyPrecisionInvalid);
    }

    public static IRuleBuilderOptions<T, decimal> MoneyRule<T>(this IRuleBuilder<T, decimal> rule)
    {
        return rule
            .Must(value => value >= 0)
            .WithMessage(MoneyNegativeInvalid)
            .Must(value => decimal.Round(value, 2, MidpointRounding.AwayFromZero) == value)
            .WithMessage(MoneyScaleInvalid)
            .Must(value => Math.Abs(value) <= MaxMoneyValue)
            .WithMessage(MoneyPrecisionInvalid);
    }

    public static IRuleBuilderOptions<T, decimal> QuantityRule<T>(this IRuleBuilder<T, decimal> rule)
    {
        return rule
            .Must(v => decimal.Round(v, 3, MidpointRounding.AwayFromZero) == v)
            .WithMessage(QtyScaleInvalid)
            .Must(v => Math.Abs(v) <= MaxQtyValue)
            .WithMessage(QtyPrecisionInvalid);
    }
}
