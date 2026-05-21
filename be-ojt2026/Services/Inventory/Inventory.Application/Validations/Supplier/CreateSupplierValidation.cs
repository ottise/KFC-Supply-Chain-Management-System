using FluentValidation;
using Inventory.Application.DTOs.Supplier;

namespace Inventory.Application.Validations.Supplier;

public class CreateSupplierValidation : AbstractValidator<CreateSupplierRequest>
{
    public CreateSupplierValidation()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên chỗ cung cấp là bắt buộc")
            .MaximumLength(255).WithMessage("Tên nhà cung cấp không được vượt quá 255 ký tự");

        RuleFor(x => x.ContactPerson)
             .NotEmpty().WithMessage("Tên nhà cung cấp là bắt buộc")
            .MaximumLength(255).WithMessage("Tên người liên hệ không được vượt quá 255 ký tự");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Số điện thoại là bắt buộc")
            .Matches(@"^\+?[0-9]{10,12}$").WithMessage("Số điện thoại không hợp lệ")
            .MaximumLength(20).WithMessage("Số điện thoại không được vượt quá 12 ký tự");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không hợp lệ")
            .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự");

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Địa chỉ không được vượt quá 500 ký tự");
    }
}
