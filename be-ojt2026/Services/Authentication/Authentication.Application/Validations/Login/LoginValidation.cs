using Authentication.Application.DTOs.Login;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Validations.Login
{
    public class LoginValidation : AbstractValidator<LoginRequest>
    {
        public LoginValidation()
        {
            RuleFor(x => x.EmailOrUsername).NotEmpty().WithMessage("Bắc buộc có Email hoặc username");
            RuleFor(x => x.Password).StrongPassword();
        }
    }
}
