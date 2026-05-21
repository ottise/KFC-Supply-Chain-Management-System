using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class ProductWarehouseConfiguration : IEntityTypeConfiguration<ProductWarehouse>
{
    public void Configure(EntityTypeBuilder<ProductWarehouse> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__product___3213E83FAAAAAAAA"); // Generic PK name

        entity.ToTable("product_warehouses");

        entity.Property(e => e.Id).HasColumnName("id");
        
        entity.Property(e => e.CreatedAt)
            .HasDefaultValueSql("(sysdatetime())")
            .HasColumnName("created_at");

        entity.Property(e => e.CreatedById).HasColumnName("created_by_id");

        entity.Property(e => e.IsActive)
            .HasDefaultValue(true)
            .HasColumnName("is_active");
            
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        
        entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

        entity.HasOne(d => d.Product).WithMany(p => p.ProductWarehouses)
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__product_w__produ__BBBBBBBB");

        entity.HasOne(d => d.Warehouse).WithMany(p => p.ProductWarehouses)
            .HasForeignKey(d => d.WarehouseId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__product_w__wareh__CCCCCCCC");
    }
}
