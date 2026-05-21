using Authentication.Application.DTOs.Login;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Validations.Login
{
    public class ResetPasswordValidation : AbstractValidator<ResetPasswordRequest>
    {
        public ResetPasswordValidation()
        {
            RuleFor(x => x.Email).ValidEmail();
            RuleFor(x => x.OtpCode).ValidOtp();
            RuleFor(x => x.NewPassword).StrongPassword();
            RuleFor(x => x.ConfirmPassword).StrongPassword();
        }
    }
}
