using System;
using System.Domain.Enums;

namespace System.Domain.Entities
{
    public class SystemMaintenance
    {
        public string Id { get; set; } = null!;

        public MaintenanceStatus Status { get; set; }

        public string Reason { get; set; } = null!;

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public DateTime CreatedAt { get; set; }

        public string CreatedBy { get; set; } = null!;
    }
}