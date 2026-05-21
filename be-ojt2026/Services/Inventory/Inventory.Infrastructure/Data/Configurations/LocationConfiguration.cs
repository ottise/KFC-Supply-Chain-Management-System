using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__location__3213E83F4AAD27B6");

        entity.ToTable("locations");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.IsActive).HasColumnName("is_active");
        entity.Property(e => e.Name)
            .HasMaxLength(255)
            .HasColumnName("name");
        entity.Property(e => e.ParentId).HasColumnName("parent_id");
        entity.Property(e => e.Type)
            .HasMaxLength(255)
            .HasColumnName("type");
        entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

        entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
            .HasForeignKey(d => d.ParentId)
            .HasConstraintName("FK__locations__paren__02084FDA");

        entity.HasOne(d => d.Warehouse).WithMany(p => p.Locations)
            .HasForeignKey(d => d.WarehouseId)
            .HasConstraintName("FK_locations_warehouses");
    }
}
