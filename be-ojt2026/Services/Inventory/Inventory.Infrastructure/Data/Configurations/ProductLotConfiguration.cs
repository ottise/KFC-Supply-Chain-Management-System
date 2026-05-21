using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class ProductLotConfiguration : IEntityTypeConfiguration<ProductLot>
{
    public void Configure(EntityTypeBuilder<ProductLot> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__product___3213E83F9B6CD3D5");

        entity.ToTable("product_lots");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.ExpirationDate).HasColumnName("expiration_date");
        entity.Property(e => e.LotNumber)
            .HasMaxLength(255)
            .HasColumnName("lot_number");
        entity.Property(e => e.ProductId).HasColumnName("product_id");

        entity.HasOne(d => d.Product).WithMany(p => p.ProductLots)
            .HasForeignKey(d => d.ProductId)
            .HasConstraintName("FK__product_l__produ__09A971A2");
    }
}
