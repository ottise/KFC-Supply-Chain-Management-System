using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__warehouse__3213E83F4AAD27B6");

        entity.ToTable("warehouses");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.Address)
            .HasMaxLength(500)
            .HasColumnName("address");
        entity.Property(e => e.AreaSqm)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("area_sqm");
        entity.Property(e => e.CreatedAt)
            .HasColumnType("datetime2(7)")
            .HasColumnName("created_at");
        entity.Property(e => e.Email)
            .HasMaxLength(255)
            .HasColumnName("email");
        entity.Property(e => e.IsActive)
            .HasColumnName("is_active");
        entity.Property(e => e.ManagerId)
            .HasColumnName("manager_id");
        entity.Property(e => e.Name)
            .HasMaxLength(255)
            .HasColumnName("name");
        entity.Property(e => e.Notes)
            .HasColumnName("notes");
        entity.Property(e => e.Phone)
            .HasMaxLength(50)
            .HasColumnName("phone");
        entity.Property(e => e.UpdatedAt)
            .HasColumnType("datetime2(7)")
            .HasColumnName("updated_at");
        entity.Property(e => e.WarehouseCode)
            .HasMaxLength(50)
            .HasColumnName("warehouse_code");
        entity.Property(e => e.WarehouseType)
            .HasMaxLength(100)
            .HasColumnName("warehouse_type");
    }
}
