using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class SaleOrderConfiguration : IEntityTypeConfiguration<SaleOrder>
{
    public void Configure(EntityTypeBuilder<SaleOrder> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__sale_orders__3213E83F");

        entity.ToTable("sale_orders");

        entity.HasIndex(e => e.OrderNo, "UQ__sale_orders__order_no").IsUnique();

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.OrderNo)
            .HasMaxLength(50)
            .HasColumnName("order_no");
        entity.Property(e => e.CustomerId).HasColumnName("customer_id");
        entity.Property(e => e.Status)
            .HasMaxLength(30)
            .HasColumnName("status");
        entity.Property(e => e.TotalAmount)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("total_amount");
        entity.Property(e => e.CreatedById).HasColumnName("created_by_id");
        entity.Property(e => e.CreatedByName)
            .HasMaxLength(255)
            .HasColumnName("created_by_name");
        entity.Property(e => e.Note)
            .HasMaxLength(500)
            .HasColumnName("note");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
        entity.Property(e => e.CompletedAt).HasColumnName("completed_at");

        entity.HasOne(d => d.Customer).WithMany(p => p.SaleOrders)
            .HasForeignKey(d => d.CustomerId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__sale_orders__customer");
    }
}
