using Authentication.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Infrastructure.Data.Configurations
{
    public class PasswordResetTokensConfiguration : IEntityTypeConfiguration<PasswordResetToken>
    {
        public void Configure(EntityTypeBuilder<PasswordResetToken> entity)
        {
            entity.HasKey(p => p.Id).HasName("PK__PasswordResetTokens__3213E83");

            entity.Property(p => p.Id)
                   .HasColumnName("id")
                   .ValueGeneratedOnAdd();

            entity.Property(p => p.UserId)
                   .HasColumnName("user_id")
                   .IsRequired();

            entity.Property(p => p.OtpCode)
                   .HasColumnName("otp_code")
                   .HasMaxLength(10)
                   .IsRequired();

            entity.Property(p => p.ExpirationTime)
                   .HasColumnName("expiration_time")
                   .IsRequired();

            entity.Property(p => p.IsUsed)
                   .HasColumnName("is_used")
                   .HasDefaultValue(false);

            entity.Property(p => p.CreatedAt)
                   .HasColumnName("created_at")
                   .HasDefaultValueSql("GETDATE()");

            entity.HasOne<User>()
                   .WithMany()
                   .HasForeignKey(p => p.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
