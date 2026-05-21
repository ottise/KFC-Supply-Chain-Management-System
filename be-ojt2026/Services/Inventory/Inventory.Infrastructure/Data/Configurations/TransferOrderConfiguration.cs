using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class TransferOrderConfiguration : IEntityTypeConfiguration<TransferOrder>
{
    public void Configure(EntityTypeBuilder<TransferOrder> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__transfer_orders__3213E83F");

        entity.ToTable("transfer_orders");

        entity.HasIndex(e => e.TransferNo, "UQ__transfer_orders__transfer_no").IsUnique();

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.TransferNo)
            .HasMaxLength(50)
            .HasColumnName("transfer_no");
        entity.Property(e => e.FromLocationId).HasColumnName("from_location_id");
        entity.Property(e => e.ToLocationId).HasColumnName("to_location_id");
        entity.Property(e => e.Status)
            .HasMaxLength(30)
            .HasColumnName("status");
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

        entity.HasOne(d => d.FromLocation).WithMany()
            .HasForeignKey(d => d.FromLocationId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__transfer_orders__from_location");

        entity.HasOne(d => d.ToLocation).WithMany()
            .HasForeignKey(d => d.ToLocationId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__transfer_orders__to_location");
    }
}
