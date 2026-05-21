using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class TransferOrderItemConfiguration : IEntityTypeConfiguration<TransferOrderItem>
{
    public void Configure(EntityTypeBuilder<TransferOrderItem> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__transfer_order_items__3213E83F");

        entity.ToTable("transfer_order_items");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.TransferOrderId).HasColumnName("transfer_order_id");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.RequestedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("requested_qty");
        entity.Property(e => e.TransferredQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("transferred_qty");

        entity.HasOne(d => d.Product).WithMany()
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__transfer_order_items__product");

        entity.HasOne(d => d.TransferOrder).WithMany(p => p.TransferOrderItems)
            .HasForeignKey(d => d.TransferOrderId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__transfer_order_items__transfer_order");
    }
}
