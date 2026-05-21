using Finance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Finance.Presentation.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<FinanceDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        return services;
    }
}
