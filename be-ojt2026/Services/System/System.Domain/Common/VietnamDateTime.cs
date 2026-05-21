using System;

namespace System.Domain.Common
{
    public static class VietnamDateTime
    {
        private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

        public static DateTime Now => DateTime.UtcNow.Add(VietnamOffset);

        public static DateTime UtcNow => DateTime.UtcNow;

        public static DateTime ToVietnamTime(this DateTime dateTime)
        {
            if (dateTime.Kind == DateTimeKind.Unspecified)
            {
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc).Add(VietnamOffset);
            }
            return dateTime.ToUniversalTime().Add(VietnamOffset);
        }

        public static DateTime ToUniversalTime(this DateTime dateTime)
        {
            if (dateTime.Kind == DateTimeKind.Unspecified)
            {
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }
            return dateTime.ToUniversalTime();
        }
    }
}
