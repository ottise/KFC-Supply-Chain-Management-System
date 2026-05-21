using Authentication.Application.IRepositories;
using Authentication.Application.IServices;
using Authentication.Application.Services;
using Authentication.Application.Validations.User;
using Authentication.Infrastructure.Repositories;
using FluentValidation;

namespace Authentication.Presentation.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // FluentValidation: register all validators so controllers can inject IValidator<T>
        services.AddValidatorsFromAssemblyContaining<CreateUserValidation>();

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IOtpRepository, OtpRepository>();
        services.AddScoped<IEmailRepository, EmailRepository>();
        // Services
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IMailService, MailService>();
        
        // UnitOfWork registration will be added when its abstraction is public and available.
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
