using Inventory.Application.DTOs.InventoryAdjustment;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class InventoryAdjustmentService : IInventoryAdjustmentService
    {
        private readonly IUnitOfWork _unitOfWork;

        public InventoryAdjustmentService(IUnitOfWork uow)
        {
            _unitOfWork = uow;
        }

        public async Task<InventoryAdjustment> CreateAdjustment()
        {
            var adj = await _unitOfWork.InventoryAdjustment.AddInventoryAdjustment();

            if (adj == null)
                throw new InvalidOperationException("Failed to create inventory adjustment");

            await _unitOfWork.SaveChangesAsync();
            return adj;
        }

        public async Task CompleteAdjustment(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid adjustment id");

            await _unitOfWork.InventoryAdjustment.CompletedInventoryAdjustmentStatus(id);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<InventoryAdjustment>> GetAdjustmentsByLocation(int locationId)
        {
            if (locationId <= 0)
                throw new ArgumentException("Invalid location id");

            return await _unitOfWork.InventoryAdjustment.GetAdjustmentsByLocationAsync(locationId);
        }
        public async Task<InventoryAdjustment?> GetById(int id)
        {
            var adjustment = await _unitOfWork.InventoryAdjustment.GetByIdAsync(id);

            if (adjustment == null)
                throw new KeyNotFoundException($"Không tìm thấy Adjustment {id}");

            return adjustment;

        }
        public async Task<List<InventoryAdjustment>> GetInventoryAdjustmentByAssigneeIdAsync(int assigneeId)
        {
            if (assigneeId <= 0)
                throw new ArgumentException("AssigneeId không hợp lệ");

            var adjustments = await _unitOfWork.InventoryAdjustment.GetInventoryAdjustmentByAssigneeIdAsync(assigneeId);

            if (adjustments == null || !adjustments.Any())
                throw new KeyNotFoundException($"Không tìm thấy phiếu kiểm kê nào cho assignee {assigneeId}");

            return adjustments;
        }
        public async Task<List<InventoryAdjustment>> GetAllAdjustment()
        {
            return await _unitOfWork.InventoryAdjustment.GetAllAsync();
        }
        public async Task UpdateAdjustment(InventoryAdjustment adjustment)
{
    if (adjustment == null)
        throw new ArgumentNullException(nameof(adjustment));

    if (adjustment.Id <= 0)
        throw new ArgumentException("Invalid adjustment id");

    await _unitOfWork.InventoryAdjustment.UpdateAdjustment(adjustment);
    await _unitOfWork.SaveChangesAsync();
}

    }
}
