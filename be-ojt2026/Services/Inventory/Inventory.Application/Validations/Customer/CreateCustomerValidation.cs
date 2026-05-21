using FluentValidation;
using Inventory.Application.DTOs.Customer;

namespace Inventory.Application.Validations.Customer;

public class CreateCustomerValidation : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerValidation()
    {
        RuleFor(x => x.customerName)
            .NotEmpty().WithMessage("Tên khách hàng là bắt buộc")
            .MaximumLength(255).WithMessage("Tên khách hàng không được vượt quá 255 ký tự");

        RuleFor(x => x.phone)
            .NotEmpty().WithMessage("Số điện thoại là bắt buộc")
            .Matches(@"^\+?[0-9]{10,12}$").WithMessage("Số điện thoại không hợp lệ")
            .MaximumLength(12).WithMessage("Số điện thoại không được vượt quá 12 ký tự");

        RuleFor(x => x.email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không hợp lệ")
            .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự");

        RuleFor(x => x.address)
            .MaximumLength(500).WithMessage("Địa chỉ không được vượt quá 500 ký tự");
    }
}
