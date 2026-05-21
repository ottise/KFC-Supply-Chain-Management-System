using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class ReorderingRuleConfiguration : IEntityTypeConfiguration<ReorderingRule>
{
    public void Configure(EntityTypeBuilder<ReorderingRule> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__reorderi__3213E83F6268E6C3");

        entity.ToTable("reordering_rules");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.IsActive)
            .HasDefaultValue(true)
            .HasColumnName("is_active");
        entity.Property(e => e.ProductWarehouseId).HasColumnName("product_warehouse_id");
        
        entity.Property(e => e.MinQty)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("min_qty");

        entity.Property(e => e.MaxQty)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("max_qty");

        entity.Property(e => e.TriggerType)
            .HasMaxLength(255)
            .HasColumnName("trigger_type");

        entity.HasOne(d => d.ProductWarehouse).WithMany(p => p.ReorderingRules)
            .HasForeignKey(d => d.ProductWarehouseId)
            .HasConstraintName("FK__reorderin__produ__DDDDDDDD");
    }
}
