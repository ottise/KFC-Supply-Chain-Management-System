using Authentication.Application.DTOs.Login;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Validations.Login
{
    public class ForgotPasswordValidation : AbstractValidator<ForgotPasswordRequest>
    {
        public ForgotPasswordValidation()
        {
            RuleFor(x => x.Email).ValidEmail();
        }
    }
}
