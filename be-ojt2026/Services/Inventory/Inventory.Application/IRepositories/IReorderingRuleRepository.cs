using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface IReorderingRuleRepository
    {
        Task<(IEnumerable<ReorderingRule> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? productWarehouseId = null, int? managerId = null, int? warehouseId = null);
        Task<ReorderingRule> CreateReOrderingRuleAsync(ReorderingRule request);
        Task<ReorderingRule> UpdateReOrderingRuleAsync(ReorderingRule request);
        Task<ReorderingRule?> DeleteReorderingRuleAsync(int productWarehouseId);
        Task<ReorderingRule?> ChangeStatusAsync(int productWarehouseId, bool isActive);
        Task<ReorderingRule?> CheckExistingReorderRuleAsync(int productWarehouseId);
        Task<ReorderingRule?> GetActiveReorderingRuleAsync(int productWarehouseId);
        Task<(IEnumerable<(ReorderingRule Rule, decimal AvailableQty)> Items, int TotalCount)> GetRulesBelowMinQtyAsync(int page, int pageSize, int? managerId = null, int? warehouseId = null);
    }
}
