using Microsoft.EntityFrameworkCore;
using System.Infrastructure.Data;

namespace System.Presentation.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<SystemDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        return services;
    }
}