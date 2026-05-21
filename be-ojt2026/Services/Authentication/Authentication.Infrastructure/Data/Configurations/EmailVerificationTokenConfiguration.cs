using Authentication.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Authentication.Infrastructure.Data.Configurations
{
    public class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
    {
        public void Configure(EntityTypeBuilder<EmailVerificationToken> entity)
        {
            entity.HasKey(p => p.Id)
                   .HasName("PK__EmailVerificationTokens__3213E83");

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

        }
    }
}
