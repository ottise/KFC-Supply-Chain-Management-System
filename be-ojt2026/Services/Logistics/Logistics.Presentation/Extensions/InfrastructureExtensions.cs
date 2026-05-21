using Microsoft.EntityFrameworkCore;
using Logistics.Infrastructure.Data;

namespace Logistics.Presentation.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<LogisticsDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        return services;
    }
}