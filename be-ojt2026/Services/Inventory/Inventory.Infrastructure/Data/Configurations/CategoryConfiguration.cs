using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__categori__3213E83F21C7DFDC");

        entity.ToTable("categories");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.IsActive)
            .HasDefaultValue(true)
            .HasColumnName("is_active");
        entity.Property(e => e.Name)
            .HasMaxLength(255)
            .HasColumnName("name");
        entity.Property(e => e.ParentId).HasColumnName("parent_id");

        //entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
        //    .HasForeignKey(d => d.ParentId)
        //    .HasConstraintName("FK__categorie__paren__7E37BEF6");
    }
}
