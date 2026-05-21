using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class CurrentInventoryService : ICurrentInventoryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CurrentInventoryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CurrentInventory?> GetCurrentInventoryById(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid inventory id");

            return await _unitOfWork.CurrentInventory.GetCurrentInventoryById(id);
        }

        public async Task UpdateQuantity(int id, decimal newQuantity)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid inventory id");

            if (newQuantity < 0)
                throw new ArgumentException("Quantity cannot be negative");

            await _unitOfWork.CurrentInventory.UpdateQuantityCurrentInventory(id, newQuantity);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<IEnumerable<CurrentInventory>> GetByLocationAsync(int locationId)
        {
            if (locationId <= 0)
                throw new ArgumentException("Invalid location id");

            return await _unitOfWork.CurrentInventory.GetByLocationAsync(locationId);

        }


        public async Task<CurrentInventory?> GetCurrentInventoryByLotIdAndProductIdAndLocationId(int productId, int lotId, int location)
        {
            if (productId <= 0) throw new ArgumentException("Invalid product id");
            if (lotId <= 0) throw new ArgumentException("Invalid lot id");

            return await _unitOfWork.CurrentInventory.GetCurrentInventoryByLotIdAndProductIdAndLocationId(productId, lotId, location);
        }

        public async Task<CurrentInventory> CreateCurrentInventory(CurrentInventory currentInventory)
        {
            if (currentInventory == null) throw new ArgumentNullException(nameof(currentInventory));
            if (currentInventory.ProductId == null || currentInventory.ProductId <= 0) throw new ArgumentException("Invalid product id");

            await _unitOfWork.CurrentInventory.CreateCurrentInventory(currentInventory);
            await _unitOfWork.SaveChangesAsync();
            return currentInventory;

        }
        public async Task UpdateCurrentInventory(CurrentInventory inventory)
        {
            await _unitOfWork.CurrentInventory.UpdateCurrentInventory(inventory);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<CurrentInventory>> GetCurrentInventoryByIds(List<int> ids)
        {
            if (ids == null || !ids.Any())
                throw new ArgumentException("Danh sách Id inventory không được rỗng");

            return await _unitOfWork.CurrentInventory.GetByIdsAsync(ids);
        }
        public async Task<List<CurrentInventory>> GetCurrentInventoriesByLocationIds(List<int> locationIds)
        {
            if (locationIds == null || !locationIds.Any())
                throw new ArgumentException("Danh sách locationId không hợp lệ");

            var inventories = await _unitOfWork.CurrentInventory.GetCurrentInventoriesByLocationIdsAsync(locationIds);

            if (inventories == null || !inventories.Any())
                throw new KeyNotFoundException("Không tìm thấy inventory nào cho các location đã chọn");

            // Validate từng inventory
            foreach (var inv in inventories)
            {
                if (!inv.ProductId.HasValue)
                    throw new InvalidOperationException($"Inventory {inv.Id} thiếu ProductId");

                if (!inv.LocationId.HasValue)
                    throw new InvalidOperationException($"Inventory {inv.Id} thiếu LocationId");

                if (inv.Quantity < 0)
                    throw new InvalidOperationException($"Inventory {inv.Id} có số lượng không hợp lệ");
            }

            return inventories;
        }
    }
}

