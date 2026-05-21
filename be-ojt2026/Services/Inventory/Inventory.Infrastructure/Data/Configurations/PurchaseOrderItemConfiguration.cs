using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItem>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderItem> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__purchase__3213E83F6937B16C");

        entity.ToTable("purchase_order_items");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.OrderedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("ordered_qty");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.PurchaseOrderId).HasColumnName("purchase_order_id");
        entity.Property(e => e.ReceivedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("received_qty");
        entity.Property(e => e.UnitPrice)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("unit_price");
        entity.Property(e => e.Subtotal)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("subtotal");
        entity.Property(e => e.LotId).HasColumnName("lot_id");

        entity.HasOne(d => d.Product).WithMany(p => p.PurchaseOrderItems)
            .HasForeignKey(d => d.ProductId)
            .HasConstraintName("FK__purchase___produ__01142BA1");

        entity.HasOne(d => d.PurchaseOrder).WithMany(p => p.PurchaseOrderItems)
            .HasForeignKey(d => d.PurchaseOrderId)
            .HasConstraintName("FK__purchase___purch__00200768");

        entity.HasOne(d => d.Lot).WithMany()
            .HasForeignKey(d => d.LotId)
            .HasConstraintName("FK_purchase_order_items_product_lots_lot_id");
    }
}
