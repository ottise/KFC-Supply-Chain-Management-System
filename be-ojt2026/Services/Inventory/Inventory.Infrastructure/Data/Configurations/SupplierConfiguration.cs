using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__supplier__3213E83F727A811E");

        entity.ToTable("suppliers");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.Address)
            .HasMaxLength(255)
            .HasColumnName("address");
        entity.Property(e => e.ContactPerson)
            .HasMaxLength(255)
            .HasColumnName("contact_person");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.Email)
            .HasMaxLength(255)
            .HasColumnName("email");
        entity.Property(e => e.IsActive)
            .HasDefaultValue(true)
            .HasColumnName("is_active");
        entity.Property(e => e.Name)
            .HasMaxLength(255)
            .HasColumnName("name");
        entity.Property(e => e.Phone)
            .HasMaxLength(255)
            .HasColumnName("phone");
    }
}
