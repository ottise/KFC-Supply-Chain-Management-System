using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class CurrentInventoryConfiguration : IEntityTypeConfiguration<CurrentInventory>
{
    public void Configure(EntityTypeBuilder<CurrentInventory> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__current___3213E83F2E3F83E1");

        entity.ToTable("current_inventory");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.LocationId).HasColumnName("location_id");
        entity.Property(e => e.LotId).HasColumnName("lot_id");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.Quantity)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("quantity");
        entity.Property(e => e.ReservedQuantity)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("reserved_quantity");

        entity.HasOne(d => d.Location).WithMany(p => p.CurrentInventories)
            .HasForeignKey(d => d.LocationId)
            .HasConstraintName("FK__current_i__locat__0B91BA14");

        entity.HasOne(d => d.Lot).WithMany(p => p.CurrentInventories)
            .HasForeignKey(d => d.LotId)
            .HasConstraintName("FK__current_i__lot_i__0C85DE4D");

        entity.HasOne(d => d.Product).WithMany(p => p.CurrentInventories)
            .HasForeignKey(d => d.ProductId)
            .HasConstraintName("FK__current_i__produ__0A9D95DB");
    }
}
