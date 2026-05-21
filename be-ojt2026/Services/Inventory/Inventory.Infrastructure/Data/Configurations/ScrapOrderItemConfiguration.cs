using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class ScrapOrderItemConfiguration : IEntityTypeConfiguration<ScrapOrderItem>
{
    public void Configure(EntityTypeBuilder<ScrapOrderItem> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__scrap_or__3213E83F");

        entity.ToTable("scrap_order_items");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.ScrapOrderId).HasColumnName("scrap_order_id");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.Quantity)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("quantity");
        entity.Property(e => e.UomId).HasColumnName("uom_id");
        entity.Property(e => e.LotId).HasColumnName("lot_id");
        entity.Property(e => e.Reason)
            .HasMaxLength(255)
            .HasColumnName("reason");

        entity.HasOne(d => d.ScrapOrder).WithMany(p => p.ScrapOrderItems)
            .HasForeignKey(d => d.ScrapOrderId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_scrap_order_items_scrap_orders");

        entity.HasOne(d => d.Product).WithMany()
            .HasForeignKey(d => d.ProductId)
            .HasConstraintName("FK_scrap_order_items_products");

        entity.HasOne(d => d.Uom).WithMany()
            .HasForeignKey(d => d.UomId)
            .HasConstraintName("FK_scrap_order_items_uom");

        entity.HasOne(d => d.Lot).WithMany()
            .HasForeignKey(d => d.LotId)
            .HasConstraintName("FK_scrap_order_items_product_lots");
    }
}
