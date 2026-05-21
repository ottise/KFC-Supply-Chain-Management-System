using FluentValidation;
using Inventory.Application.DTOs.ReorderingRule;

namespace Inventory.Application.Validations.ReorderingRule;

public class UpdateReorderingRuleValidation : AbstractValidator<UpdateReorderingRuleRequest>
{
    public UpdateReorderingRuleValidation()
    {
        RuleFor(x => x.MinQty)
            .GreaterThan(0).WithMessage("Số lượng tối thiểu phải lớn hơn 0")
            .When(x => x.MinQty.HasValue);

        RuleFor(x => x.MaxQty)
            .GreaterThan(x => x.MinQty).WithMessage("Số lượng tối đa phải lớn hơn số lượng tối thiểu")
            .When(x => x.MaxQty.HasValue && x.MinQty.HasValue);

        RuleFor(x => x.TriggerType)
            .NotEmpty().WithMessage("Loại kích hoạt là bắt buộc")
            .Must(BeValidTriggerType).WithMessage("Loại kích hoạt không hợp lệ (phải là 'Automatic' hoặc 'Manual')")
            .When(x => !string.IsNullOrEmpty(x.TriggerType));
    }

    private bool BeValidTriggerType(string triggerType)
    {
        return triggerType.Equals("Automatic", StringComparison.OrdinalIgnoreCase) ||
               triggerType.Equals("Manual", StringComparison.OrdinalIgnoreCase);
    }
}
