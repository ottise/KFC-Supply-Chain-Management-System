using Authentication.Application.DTOs.Login;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Validations.Login
{
    public class RegisterValidation : AbstractValidator<RegisterRequest>
    {
        public RegisterValidation()
        {
            RuleFor(x => x.Email).ValidEmail();
            RuleFor(x => x.Password).StrongPassword();
            RuleFor(x => x.Username).RequiredMinLength(3, "Username");
            RuleFor(x => x.Fullname).RequiredMinLength(3, "Fullname");
            RuleFor(x => x.Phone).ValidPhone();
        }
    }
}
