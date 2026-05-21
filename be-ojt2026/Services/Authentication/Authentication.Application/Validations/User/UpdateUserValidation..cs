using Authentication.Application.DTOs.User;
using FluentValidation;

namespace Authentication.Application.Validations.User
{
    public class UpdateUserValidation : AbstractValidator<UpdateUserRequest>
    {
        public UpdateUserValidation()
        {
            RuleFor(x => x.Fullname).RequiredMaxLength(100, "Fullname");
            RuleFor(x => x.Phone).ValidPhone();
        }
    }
}
