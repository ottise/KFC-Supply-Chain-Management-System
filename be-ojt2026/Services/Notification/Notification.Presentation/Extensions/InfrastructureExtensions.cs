using Microsoft.EntityFrameworkCore;
using Notification.Infrastructure.Data;

namespace Notification.Presentation.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<NotificationDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        return services;
    }
}