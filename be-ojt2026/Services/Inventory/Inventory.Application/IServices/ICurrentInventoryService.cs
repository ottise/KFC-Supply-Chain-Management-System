using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface ICurrentInventoryService
    {
        Task<CurrentInventory?> GetCurrentInventoryById(int id);
        Task UpdateQuantity(int id, decimal newQuantity);
        Task<IEnumerable<CurrentInventory>> GetByLocationAsync(int locationId);

        Task<CurrentInventory?> GetCurrentInventoryByLotIdAndProductIdAndLocationId(int productId, int lotId, int location);
        Task<CurrentInventory> CreateCurrentInventory(CurrentInventory currentInventory);
        Task UpdateCurrentInventory(CurrentInventory inventory);
        Task<IEnumerable<CurrentInventory>> GetCurrentInventoryByIds(List<int> ids);
        Task<List<CurrentInventory>> GetCurrentInventoriesByLocationIds(List<int> locationIds);
    }
}
