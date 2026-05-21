using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class InventoryAdjustmentConfiguration : IEntityTypeConfiguration<InventoryAdjustment>
{
    public void Configure(EntityTypeBuilder<InventoryAdjustment> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__inventor__3213E83F4BCA5997");

        entity.ToTable("inventory_adjustments");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.AdjustmentNo)
            .HasMaxLength(255)
            .HasColumnName("adjustment_no");
        entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.Status)
            .HasMaxLength(255)
            .HasColumnName("status");
        entity.Property(e => e.AssigneeId).HasColumnName("assignee_id");

    }
}
