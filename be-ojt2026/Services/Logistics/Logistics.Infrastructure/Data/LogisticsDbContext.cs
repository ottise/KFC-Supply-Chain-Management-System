using Microsoft.EntityFrameworkCore;

namespace Logistics.Infrastructure.Data
{
    public class LogisticsDbContext : DbContext
    {
        public LogisticsDbContext(DbContextOptions<LogisticsDbContext> options) : base(options)
        {
        }
    }
}
