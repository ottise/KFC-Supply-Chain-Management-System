using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface IInventoryAdjustmentRepository
    {
        Task<List<InventoryAdjustment>> GetAllAsync();
        Task<InventoryAdjustment?> GetInventoryAdjustmentById(int id);
        Task<InventoryAdjustment> AddInventoryAdjustment();
        Task CompletedInventoryAdjustmentStatus(int id);
        Task<IEnumerable<InventoryAdjustment>> GetAdjustmentsByLocationAsync(int locationId);
        Task<InventoryAdjustment?> GetByIdAsync(int id);
        Task<List<InventoryAdjustment>> GetInventoryAdjustmentByAssigneeIdAsync(int assigneeId);
        Task UpdateAdjustment(InventoryAdjustment adjustment);
    }
}
