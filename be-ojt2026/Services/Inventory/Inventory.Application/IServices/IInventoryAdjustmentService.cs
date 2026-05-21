using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface IInventoryAdjustmentService
    {
        Task<InventoryAdjustment> CreateAdjustment();
        Task CompleteAdjustment(int id);
        Task<IEnumerable<InventoryAdjustment>> GetAdjustmentsByLocation(int locationId);
        Task<InventoryAdjustment?> GetById(int id);
        Task<List<InventoryAdjustment>> GetInventoryAdjustmentByAssigneeIdAsync(int assigneeId);
        Task<List<InventoryAdjustment>> GetAllAdjustment();
        Task UpdateAdjustment(InventoryAdjustment adjustment);
    }
}
