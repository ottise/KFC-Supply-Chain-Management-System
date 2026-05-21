using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Domain.Entities;

namespace System.Infrastructure.Data.Configurations
{
    public class SystemMaintenanceConfiguration : IEntityTypeConfiguration<SystemMaintenance>
    {
        public void Configure(EntityTypeBuilder<SystemMaintenance> builder)
        {
            builder.ToTable("SystemMaintenance");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasMaxLength(20);

            builder.Property(e => e.Reason)
                .IsRequired();

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(e => e.StartTime)
                .IsRequired();

            builder.Property(e => e.EndTime)
                .IsRequired();

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETDATE()");
        }
    }
}