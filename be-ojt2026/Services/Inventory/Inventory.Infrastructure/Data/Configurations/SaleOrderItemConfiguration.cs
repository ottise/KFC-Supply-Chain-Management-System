using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class SaleOrderItemConfiguration : IEntityTypeConfiguration<SaleOrderItem>
{
    public void Configure(EntityTypeBuilder<SaleOrderItem> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__sale_order_items__3213E83F");

        entity.ToTable("sale_order_items");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.SaleOrderId).HasColumnName("sale_order_id");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.OrderedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("ordered_qty");
        entity.Property(e => e.ShippedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("shipped_qty");
        entity.Property(e => e.UnitPrice)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("unit_price");
        entity.Property(e => e.Subtotal)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("subtotal");

        entity.HasOne(d => d.Product).WithMany()
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__sale_order_items__product");

        entity.HasOne(d => d.SaleOrder).WithMany(p => p.SaleOrderItems)
            .HasForeignKey(d => d.SaleOrderId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__sale_order_items__sale_order");
    }
}
