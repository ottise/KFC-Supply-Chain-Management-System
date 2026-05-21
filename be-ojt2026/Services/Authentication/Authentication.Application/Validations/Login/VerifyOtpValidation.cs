using Authentication.Application.DTOs.Login;
using FluentValidation;

namespace Authentication.Application.Validations.Login
{
    public class VerifyOtpValidation : AbstractValidator<VerifyOtpRequest>
    {
        public VerifyOtpValidation()
        {
            RuleFor(x => x.OtpCode).ValidOtp();
        }
    }
}
