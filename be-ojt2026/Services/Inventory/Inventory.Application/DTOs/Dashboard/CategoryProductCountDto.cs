

namespace Inventory.Application.DTOs.DashBoard
{
    public class CategoryProductCountDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int ProductCount { get; set; }
    }
}
