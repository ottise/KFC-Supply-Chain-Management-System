using System;
using System.ComponentModel.DataAnnotations;

namespace System.Application.DTOs.Maintenance
{
    public class CreateMaintenanceRequest
    {
        [Required(ErrorMessage = "Reason is required.")]
        [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters.")]
        public string reason { get; set; } = null!;
        public DateTime startTime { get; set; }
        public DateTime endTime { get; set; }
    }
}
