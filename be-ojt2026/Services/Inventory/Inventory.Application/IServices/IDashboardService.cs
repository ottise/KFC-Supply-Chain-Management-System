using Inventory.Application.DTOs.Dashboard;
using Inventory.Application.DTOs.DashBoard;

namespace Inventory.Application.IServices
{
    public interface IDashBoardService
    {
        Task<List<ParentCategoryGroupDto>> GetProductCountByParentCategoryAsync();
        Task<DashboardTrendResponseDto> GetInventoryTrendAsync(DateTime startDate, DateTime endDate, IEnumerable<int>? warehouseIds = null);
        Task<List<WarehouseInventoryDto>> GetWarehouseInventoryAsync(int? warehouseId = null);
        Task<ManagerInventoryDashboardDto> GetManagerWarehouseInventoryAsync(int managerId, int? warehouseId = null);
    }
}
