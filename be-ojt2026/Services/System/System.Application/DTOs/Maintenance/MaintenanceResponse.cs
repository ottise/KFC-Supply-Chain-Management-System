using System;

namespace System.Application.DTOs.Maintenance
{
    public class MaintenanceResponse
    {
        public string id { get; set; } = null!;
        public string reason { get; set; } = null!;
        public DateTime startTime { get; set; }
        public DateTime endTime { get; set; }
        public string status { get; set; } = null!;
        public DateTime createdAt { get; set; }
        public string createdBy { get; set; } = null!;
    }
}
