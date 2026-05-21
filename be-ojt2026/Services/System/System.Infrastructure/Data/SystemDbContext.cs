using Microsoft.EntityFrameworkCore;
using System.Domain.Entities;

namespace System.Infrastructure.Data
{
    public class SystemDbContext : DbContext
    {
        public SystemDbContext(DbContextOptions<SystemDbContext> options) : base(options)
        {
        }

        public virtual DbSet<SystemMaintenance> SystemMaintenances { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(SystemDbContext).Assembly);
        }
    }
}

