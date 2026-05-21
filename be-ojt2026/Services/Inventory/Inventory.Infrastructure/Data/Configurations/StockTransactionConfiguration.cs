using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inventory.Domain.Entities;

namespace Inventory.Infrastructure.Data.Configurations;

public class StockTransactionConfiguration : IEntityTypeConfiguration<StockTransaction>
{
    public void Configure(EntityTypeBuilder<StockTransaction> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__stock_tr__3213E83FEC56ACB9");

        entity.ToTable("stock_transactions");

        entity.Property(e => e.Id).HasColumnName("id");
        entity.Property(e => e.ActualQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("actual_qty");
        entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
        entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        entity.Property(e => e.PlannedDate)
            .HasColumnType("datetime2(7)")
            .HasColumnName("planned_date");
        entity.Property(e => e.DocumentId).HasColumnName("document_id");
        entity.Property(e => e.FromLocationId).HasColumnName("from_location_id");
        entity.Property(e => e.LotId).HasColumnName("lot_id");
        entity.Property(e => e.PlannedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("planned_qty");
        entity.Property(e => e.ProductId).HasColumnName("product_id");
        entity.Property(e => e.ReservedQty)
            .HasColumnType("decimal(18, 3)")
            .HasColumnName("reserved_qty");
        entity.Property(e => e.Status)
            .HasMaxLength(255)
            .HasColumnName("status");
        entity.Property(e => e.ToLocationId).HasColumnName("to_location_id");
        entity.Property(e => e.TransactionType)
            .HasMaxLength(255)
            .HasColumnName("transaction_type");
        entity.Property(e => e.UomId).HasColumnName("uom_id");

        entity.HasOne(d => d.Document).WithMany(p => p.StockTransactions)
            .HasForeignKey(d => d.DocumentId)
            .HasConstraintName("FK__stock_tra__docum__04E4BC85");

        entity.HasOne(d => d.FromLocation).WithMany(p => p.StockTransactionFromLocations)
            .HasForeignKey(d => d.FromLocationId)
            .HasConstraintName("FK__stock_tra__from___07C12930");

        entity.HasOne(d => d.Product).WithMany(p => p.StockTransactions)
            .HasForeignKey(d => d.ProductId)
            .HasConstraintName("FK__stock_tra__produ__05D8E0BE");

        entity.HasOne(d => d.ToLocation).WithMany(p => p.StockTransactionToLocations)
            .HasForeignKey(d => d.ToLocationId)
            .HasConstraintName("FK__stock_tra__to_lo__08B54D69");

        entity.HasOne(d => d.Uom).WithMany(p => p.StockTransactions)
            .HasForeignKey(d => d.UomId)
            .HasConstraintName("FK__stock_tra__uom_i__06CD04F7");
    }
}
