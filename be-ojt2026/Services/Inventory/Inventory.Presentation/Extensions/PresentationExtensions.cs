namespace Inventory.Presentation.Extensions;

public static class PresentationExtensions
{
    public static IServiceCollection AddPresentationServices(this IServiceCollection services)
    {
        // config controllers
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;


                options.JsonSerializerOptions.PropertyNamingPolicy = null;
            });
        // config cors

        // AddHttp
        services.AddHttpContextAccessor();

        return services;
    }
}
