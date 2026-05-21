

namespace Inventory.Application.DTOs.DashBoard
{
    public class ParentCategoryGroupDto
    {
        public int ParentCategoryId { get; set; }
        public string ParentCategoryName { get; set; } = string.Empty;
        public int TotalProductCount { get; set; }
        public List<CategoryProductCountDto> SubCategories { get; set; } = new List<CategoryProductCountDto>();
    }
}
