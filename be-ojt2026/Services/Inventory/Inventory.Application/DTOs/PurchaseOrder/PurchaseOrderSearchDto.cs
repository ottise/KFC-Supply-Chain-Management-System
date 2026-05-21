namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class PurchaseOrderSearchDto
    {
        /// <summary>Tìm theo tên NCC hoặc tên địa điểm đến (OR)</summary>
        public string? Search { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? FromPlannedDate { get; set; }
        public DateTime? ToPlannedDate { get; set; }
        public System.Collections.Generic.List<int>? AuthorizedLocationIds { get; set; }
        public int? CreatedById { get; set; }

        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 10;
    }
}
