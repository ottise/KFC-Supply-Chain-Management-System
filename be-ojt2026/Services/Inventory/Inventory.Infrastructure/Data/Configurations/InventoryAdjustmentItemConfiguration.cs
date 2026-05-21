using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class InventoryAdjustmentItemConfiguration : IEntityTypeConfiguration<InventoryAdjustmentItem>
{
    public void Configure(EntityTypeBuilder<InventoryAdjustmentItem> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__inventor__3213E83FA37CD710");

        entity.ToTable("inventory_adjustment_items");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.AdjustmentId).HasColumnName("adjustment_id");
        entity.Property(e => e.CountedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("counted_qty");
        entity.Property(e => e.DifferenceQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("difference_qty");
        entity.Property(e => e.LocationId).HasColumnName("location_id");
        entity.Property(e => e.LotId).HasColumnName("lot_id");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.SystemQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("system_qty");

        entity.HasOne(d => d.Adjustment).WithMany(p => p.InventoryAdjustmentItems)
            .HasForeignKey(d => d.AdjustmentId)
            .HasConstraintName("FK__inventory__adjus__0D7A0286");

        entity.HasOne(d => d.Location).WithMany(p => p.InventoryAdjustmentItems)
            .HasForeignKey(d => d.LocationId)
            .HasConstraintName("FK__inventory__locat__0F624AF8");

        entity.HasOne(d => d.Lot).WithMany(p => p.InventoryAdjustmentItems)
            .HasForeignKey(d => d.LotId)
            .HasConstraintName("FK__inventory__lot_i__10566F31");

        entity.HasOne(d => d.Product).WithMany(p => p.InventoryAdjustmentItems)
            .HasForeignKey(d => d.ProductId)
            .HasConstraintName("FK__inventory__produ__0E6E26BF");
    }
}
