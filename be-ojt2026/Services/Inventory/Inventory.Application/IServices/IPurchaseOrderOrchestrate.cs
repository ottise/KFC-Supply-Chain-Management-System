using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Inventory.Application.DTOs.PurchaseOrder;

namespace Inventory.Application.IServices
{
    public interface IPurchaseOrderOrchestrate
    {
        Task<CreateConfirmInventoryAdjustmentDto> ConfirmPurchaseOrderAsync(CreateConfirmInventoryAdjustmentDto input, int? managerId, int userId);
        Task<CreateCompletePurchaseOrderInputDto> CompletePurchaseOrderAsync(CreateCompletePurchaseOrderInputDto input, int? managerId, int userId);
        Task<CreateDraftPurchaseOrderInputDto> CreateDraftPurchaseOrderAsync(CreateDraftPurchaseOrderInputDto input, int? managerId, int userId);
        Task DeleteDraftPurchaseOrderItemAsync(int itemId, int userId);
        Task CancelPurchaseOrderAsync(int id, int userId);
        Task<HashSet<int>> GetAuthorizedLocationIdsAsync(int managerId);
    }
}
