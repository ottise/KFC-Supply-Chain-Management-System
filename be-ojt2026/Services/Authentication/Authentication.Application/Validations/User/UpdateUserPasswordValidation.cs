using Authentication.Application.DTOs.User;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Validations.User
{
    public class UpdateUserPasswordValidation : AbstractValidator<UpdateUserPasswordRequest>
    {
        public UpdateUserPasswordValidation()
        {
            RuleFor(x => x.CurrentPassword).StrongPassword();
            RuleFor(x => x.NewPassword).StrongPassword();
        }
    }
}
