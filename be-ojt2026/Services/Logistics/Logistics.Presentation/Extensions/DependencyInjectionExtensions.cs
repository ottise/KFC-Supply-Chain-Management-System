namespace Logistics.Presentation.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Repositories

        // Services

        // UnitOfWork registration will be added when its abstraction is public and available.
        return services;
    }
}
