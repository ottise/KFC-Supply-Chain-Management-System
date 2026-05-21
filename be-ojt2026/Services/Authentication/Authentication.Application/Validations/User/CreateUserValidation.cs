using Authentication.Application.DTOs.User;
using FluentValidation;

namespace Authentication.Application.Validations.User
{
    public class CreateUserValidation : AbstractValidator<CreateUserRequest>
    {
        public CreateUserValidation()
        {
            RuleFor(x => x.Email).ValidEmail();
            RuleFor(x => x.Password).StrongPassword();
            RuleFor(x => x.Username).RequiredMinLength(3, "Username");
            RuleFor(x => x.Fullname).RequiredMinLength(3, "Fullname");
            RuleFor(x => x.Phone).ValidPhone();
        }
    }
}
