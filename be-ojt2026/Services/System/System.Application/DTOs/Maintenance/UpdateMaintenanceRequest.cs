using System;
using System.Text.Json.Serialization;
using System.Domain.Enums;

namespace System.Application.DTOs.Maintenance
{
    public class UpdateMaintenanceRequest
    {
        public string reason { get; set; } = null!;
        public DateTime startTime { get; set; }
        public DateTime endTime { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public MaintenanceStatus status { get; set; }
    }
}