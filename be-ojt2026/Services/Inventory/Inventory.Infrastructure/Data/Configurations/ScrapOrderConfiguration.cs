using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class ScrapOrderConfiguration : IEntityTypeConfiguration<ScrapOrder>
{
    public void Configure(EntityTypeBuilder<ScrapOrder> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__scrap_or__3213E83F");

        entity.ToTable("scrap_orders");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.ScrapNo)
            .HasMaxLength(50)
            .HasColumnName("scrap_no");
        entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
        entity.Property(e => e.LocationId).HasColumnName("location_id");
        entity.Property(e => e.ToLocationId).HasColumnName("to_location_id");
        entity.Property(e => e.Status)
            .HasMaxLength(255)
            .HasColumnName("status");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
        entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
        entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
        entity.Property(e => e.CreatedByName)
            .HasMaxLength(255)
            .HasColumnName("created_by_name");

        entity.HasOne(d => d.Warehouse).WithMany()
            .HasForeignKey(d => d.WarehouseId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK_scrap_orders_warehouses");

        entity.HasOne(d => d.Location).WithMany()
            .HasForeignKey(d => d.LocationId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK_scrap_orders_locations");

        entity.HasOne(d => d.ToLocation).WithMany()
            .HasForeignKey(d => d.ToLocationId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK_scrap_orders_to_locations");
    }
}
