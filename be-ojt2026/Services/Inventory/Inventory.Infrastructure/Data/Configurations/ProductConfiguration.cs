using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__products__3213E83F623FB569");

        entity.ToTable("products");

        entity.HasIndex(e => e.Code, "UQ__products__357D4CF9651BF1B4").IsUnique();

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.BaseUomId).HasColumnName("base_uom_id");
        entity.Property(e => e.CategoryId).HasColumnName("category_id");
        entity.Property(e => e.Code)
            .HasMaxLength(255)
            .HasColumnName("code");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.IsActive)
            .HasDefaultValue(true)
            .HasColumnName("is_active");
        entity.Property(e => e.Name)
            .HasMaxLength(255)
            .HasColumnName("name");
        entity.Property(e => e.ProductType)
            .HasMaxLength(255)
            .HasColumnName("product_type");
        entity.Property(e => e.PurchaseUomId).HasColumnName("purchase_uom_id");
        entity.Property(e => e.SalePrice)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("sale_price");
        entity.Property(e => e.StockPrice)
            .HasColumnType("decimal(18, 2)")
            .HasColumnName("stock_price");
        entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

        entity.HasOne(d => d.BaseUom).WithMany(p => p.ProductBaseUoms)
            .HasForeignKey(d => d.BaseUomId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK__products__base_u__7B5B524B");

        //entity.HasOne(d => d.Category).WithMany(p => p.Products)
        //    .HasForeignKey(d => d.CategoryId)
        //    .HasConstraintName("FK__products__catego__7D439ABD");

        entity.HasOne(d => d.PurchaseUom).WithMany(p => p.ProductPurchaseUoms)
            .HasForeignKey(d => d.PurchaseUomId)
            .HasConstraintName("FK__products__purcha__7C4F7684");
    }
}
