using Authentication.Application.DTOs.Login;
using FluentValidation;

namespace Authentication.Application.Validations.Login
{
    public class VerifyEmailValidation : AbstractValidator<VerifyEmailRequest>
    {
        public VerifyEmailValidation()
        {
            RuleFor(x => x.OtpCode)
                .NotEmpty().WithMessage("OTP code is required")
                .Length(6).WithMessage("OTP code must be 6 digits");
        }
    }
}
