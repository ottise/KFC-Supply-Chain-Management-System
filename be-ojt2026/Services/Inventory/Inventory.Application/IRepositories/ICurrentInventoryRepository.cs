using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface ICurrentInventoryRepository
    {
        Task<IEnumerable<CurrentInventory>> GetAllAsync();
        Task<CurrentInventory?> GetByProductLocationLotAsync(int productId, int locationId, int? lotId);
        Task<List<CurrentInventory>> GetAvailableByProductLocationAsync(int productId, int locationId);
        Task<List<CurrentInventory>> GetAllByProductLocationAsync(int productId, int locationId);
        Task<List<CurrentInventory>> GetReservedByProductLocationAsync(int productId, int locationId);
        Task AddAsync(CurrentInventory currentInventory);
        Task UpdateAsync(CurrentInventory currentInventory);
        Task<CurrentInventory?> GetCurrentInventoryById(int id);
        Task UpdateQuantityCurrentInventory(int id, decimal quantity);
        Task<IEnumerable<CurrentInventory>> GetByLocationAsync(int locationId);
        Task<CurrentInventory?> GetCurrentInventoryByLotIdAndProductIdAndLocationId(int productId, int lotId, int location);
        Task<CurrentInventory> CreateCurrentInventory(CurrentInventory currentInventory);
        Task UpdateCurrentInventory(CurrentInventory inventory);
        Task<IEnumerable<CurrentInventory>> GetByIdsAsync(List<int> ids);
        Task<List<CurrentInventory>> GetCurrentInventoriesByLocationIdsAsync(List<int> locationIds);
        Task<List<CurrentInventory>> GetCurrentInventoriesByLotIdAsync(int lotId);
        Task<List<CurrentInventory>> GetCurrentInventoriesByLotIdsAsync(List<int> lotIds);
        Task<List<string>> GetDistinctProductTypesAsync();
    }
}
