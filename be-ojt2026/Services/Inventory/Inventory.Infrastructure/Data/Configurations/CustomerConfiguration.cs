using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__customers__3213E83F");

        entity.ToTable("customers");

        entity.Property(e => e.Id)
            .HasColumnName("id");
        entity.Property(e => e.CustomerName)
            .IsRequired()
            .HasMaxLength(255)
            .HasColumnName("customer_name");
        entity.Property(e => e.Phone)
            .HasMaxLength(50)
            .HasColumnName("phone");
        entity.Property(e => e.Email)
            .HasMaxLength(255)
            .HasColumnName("email");
        entity.Property(e => e.Address)
            .HasMaxLength(255)
            .HasColumnName("address");
        entity.Property(e => e.IsActive)
            .HasDefaultValue(true)
            .HasColumnName("is_active");
        entity.Property(e => e.CreatedAt)
            .HasColumnName("created_at");
        entity.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");
    }
}
