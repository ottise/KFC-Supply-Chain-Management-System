using Inventory.Application.DTOs;
using Inventory.Application.DTOs.Common;
using Inventory.Application.DTOs.ReorderingRule;

namespace Inventory.Application.IServices
{
    public interface IReorderingRuleService
    {
        Task<PagedResultDto<ReOrderingRuleDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? productWarehouseId = null, int? managerId = null, int? warehouseId = null);
        Task<ReOrderingRuleDto> CreateReOrderingRuleAsync(CreateReorderingRuleRequest request, int? managerId = null, int? userId = null);
        Task<bool> DeleteReOrderingRuleAsync(int productWarehouseId, int? managerId = null, int? userId = null);
        Task<bool> ChangeStatusAsync(int productWarehouseId, bool isActive, int? managerId = null, int? userId = null);
        Task<ReOrderingRuleDto> UpdaReOrOrderingRuleAsync(UpdateReorderingRuleRequest request, int productWarehouseId, int? managerId = null, int? userId = null);
        Task<PagedResultDto<ReorderingRuleWarningDto>> GetWarningsAsync(int page, int pageSize, int? managerId = null, int? warehouseId = null);
    }
}
