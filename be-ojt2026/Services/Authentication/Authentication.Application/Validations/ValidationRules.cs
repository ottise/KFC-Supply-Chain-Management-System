using FluentValidation;

namespace Authentication.Application.Validations;


public static class ValidationRules
{
    // --- Messages ---
    public const string EmailRequired = "Email is required.";
    public const string EmailInvalid = "Invalid email format.";
    public const string PasswordRequired = "Password is required.";
    public const string PasswordMinLength = "Password must be at least 8 characters long.";
    public const string PasswordUppercase = "Password must contain at least one uppercase letter.";
    public const string PasswordLowercase = "Password must contain at least one lowercase letter.";
    public const string PasswordDigit = "Password must contain at least one digit.";
    public const string PasswordSpecial = "Password must contain at least one special character.";
    public const string PhoneRequired = "Phone number is required.";
    public const string PhoneInvalid = "Invalid phone number format.";
    public const string OtpRequired = "OTP code is required.";
    public const string OtpInvalid = "Invalid OTP code format.";

    // --- Patterns ---
    public const string PhoneRegex = @"^\+?[0-9]\d{1,12}$";

    //Required + valid email. Use for any email field
    public static IRuleBuilderOptions<T, string> ValidEmail<T>(this IRuleBuilder<T, string> rule)
    {
        return rule
            .NotEmpty().WithMessage(EmailRequired)
            .EmailAddress().WithMessage(EmailInvalid);
    }

    //Required + strong password (8+ chars, upper, lower, digit, special)
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule)
    {
        return rule
            .NotEmpty().WithMessage(PasswordRequired)
            .MinimumLength(8).WithMessage(PasswordMinLength)
            .Matches(@"[A-Z]").WithMessage(PasswordUppercase)
            .Matches(@"[a-z]").WithMessage(PasswordLowercase)
            .Matches(@"[0-9]").WithMessage(PasswordDigit)
            .Matches(@"[\W]").WithMessage(PasswordSpecial);
    }

    //Required + phone format. Use for Phone
    public static IRuleBuilderOptions<T, string> ValidPhone<T>(this IRuleBuilder<T, string> rule)
    {
        return rule
            .NotEmpty().WithMessage(PhoneRequired)
            .Matches(PhoneRegex).WithMessage(PhoneInvalid);
    }

    //Required + minimum length. Use for Username, Fullname, Name
    public static IRuleBuilderOptions<T, string> RequiredMinLength<T>(this IRuleBuilder<T, string> rule, int minLength, string? fieldName = null)
    {
        var name = fieldName ?? "Field";
        return rule
            .NotEmpty().WithMessage($"{name} is required.")
            .MinimumLength(minLength).WithMessage($"{name} must be at least {minLength} characters long.");
    }

    //Required + maximum length. Use for Fullname, Name
    public static IRuleBuilderOptions<T, string> RequiredMaxLength<T>(this IRuleBuilder<T, string> rule, int maxLength, string? fieldName = null)
    {
        var name = fieldName ?? "Field";
        return rule
            .NotEmpty().WithMessage($"{name} is required.")
            .MaximumLength(maxLength).WithMessage($"{name} must not exceed {maxLength} characters.");
    }
    public static IRuleBuilderOptions<T, string> ValidOtp<T>(this IRuleBuilder<T, string> rule)
    {
        return rule
            .NotEmpty().WithMessage(OtpRequired)
            .Length(6).WithMessage(OtpInvalid);
    }
}
