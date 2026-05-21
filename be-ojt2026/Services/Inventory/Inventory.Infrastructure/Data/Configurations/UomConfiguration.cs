using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class UomConfiguration : IEntityTypeConfiguration<Uom>
{
    public void Configure(EntityTypeBuilder<Uom> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__uom__3213E83FEFE5C0E4");

        entity.ToTable("uom");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.Category)
            .HasMaxLength(255)
            .HasColumnName("category");
        entity.Property(e => e.ConversionRatio)
            .HasColumnType("decimal(18, 6)")
            .HasColumnName("conversion_ratio");
        entity.Property(e => e.IsBaseUnit).HasColumnName("is_base_unit");
        entity.Property(e => e.Name)
            .HasMaxLength(255)
            .HasColumnName("name");
    }
}
