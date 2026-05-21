using Authentication.Application.DTOs.Roles;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Validations.Roles
{
    public class CreateRoleValidation : AbstractValidator<CreateRoleRequest>
    {
        public CreateRoleValidation()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required!")
                .MaximumLength(50).WithMessage("Name must not exceed 50 characters!");
        }
    }
}
