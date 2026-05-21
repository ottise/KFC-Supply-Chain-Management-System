namespace Notification.Presentation.Extensions;

public static class PresentationExtensions
{
    public static IServiceCollection AddPresentationServices(this IServiceCollection services)
    {
        // config controllers
        services.AddControllers();

        // config cors

        // AddHttp
        services.AddHttpContextAccessor();

        return services;
    }
}
