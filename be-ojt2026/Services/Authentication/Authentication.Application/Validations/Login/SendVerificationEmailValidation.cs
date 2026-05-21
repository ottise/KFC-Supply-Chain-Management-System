using Authentication.Application.DTOs.Login;
using FluentValidation;

namespace Authentication.Application.Validations.Login
{
    public class SendVerificationEmailValidation : AbstractValidator<SendVerificationEmailRequest>
    {
        public SendVerificationEmailValidation()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format");
        }
    }
}
