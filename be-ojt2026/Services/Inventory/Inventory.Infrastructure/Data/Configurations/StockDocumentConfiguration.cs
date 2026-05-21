using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class StockDocumentConfiguration : IEntityTypeConfiguration<StockDocument>
{
    public void Configure(EntityTypeBuilder<StockDocument> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__stock_do__3213E83FF76C96C9");

        entity.ToTable("stock_documents");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.DocumentNo)
            .HasMaxLength(255)
            .HasColumnName("document_no");
        entity.Property(e => e.DocumentType)
            .HasMaxLength(255)
            .HasColumnName("document_type");
        entity.Property(e => e.FromLocationId).HasColumnName("from_location_id");
        entity.Property(e => e.Origin)
            .HasMaxLength(255)
            .HasColumnName("origin");
        entity.Property(e => e.ReferenceId).HasColumnName("reference_id");
        entity.Property(e => e.ReferenceType)
            .HasMaxLength(255)
            .HasColumnName("reference_type");
        entity.Property(e => e.Status)
            .HasMaxLength(255)
            .HasColumnName("status");
        entity.Property(e => e.ToLocationId).HasColumnName("to_location_id");

        entity.HasOne(d => d.FromLocation).WithMany(p => p.StockDocumentFromLocations)
            .HasForeignKey(d => d.FromLocationId)
            .HasConstraintName("FK__stock_doc__from___02FC7413");

        entity.HasOne(d => d.ToLocation).WithMany(p => p.StockDocumentToLocations)
            .HasForeignKey(d => d.ToLocationId)
            .HasConstraintName("FK__stock_doc__to_lo__03F0984C");
    }
}
