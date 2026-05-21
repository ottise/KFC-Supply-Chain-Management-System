using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__purchase__3213E83F31213F22");

        entity.ToTable("purchase_orders");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
        entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
        entity.Property(e => e.Status)
            .HasMaxLength(255)
            .HasColumnName("status");
        entity.Property(e => e.SupplierId).HasColumnName("supplier_id");
        entity.Property(e => e.ToLocationId).HasColumnName("to_location_id");
        entity.Property(e => e.PlannedDate).HasColumnName("planned_date");

        entity.HasOne(d => d.Supplier).WithMany(p => p.PurchaseOrders)
            .HasForeignKey(d => d.SupplierId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__purchase___suppl__7F2BE32F");

        entity.HasOne(d => d.ToLocation).WithMany()
            .HasForeignKey(d => d.ToLocationId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK_purchase_orders_to_location");
    }
}
