using Microsoft.EntityFrameworkCore;

namespace Purchase.Infrastructure.Data
{
    public class PurchaseDbContext : DbContext
    {
        public PurchaseDbContext(DbContextOptions<PurchaseDbContext> options) : base(options)
        {
        }
    }
}
