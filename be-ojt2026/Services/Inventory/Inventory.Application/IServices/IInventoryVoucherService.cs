using Inventory.Application.DTOs.InventoryAdjustment;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface IInventoryVoucherService
    {

        Task<List<StaffWorkResponseDto>> GetStaffWorkAsync( int staffId,int? lotId = null, int? locationId = null,int? warehouseId = null);
        Task<StaffWorkResponseDto> UpdateCountAsync(UpdateCountRequestDto request, int staffId);
        Task<List<ManagerWorkResponseDto>> GetManagerInventoriesAsync( int? managerId, int userId,int? lotId = null, int? locationId = null, int? warehouseId = null,string? status = null);
        Task<CreateDraftResponseDto> CreateDraftAsync(CreateDraftRequestDto request,int? managerId,int userId);
        Task<List<CompleteResponseDto>> CompleteAsync(List<CompleteRequestDto> requests,int? managerId,int userId);

        Task<List<Location>> GetLocationsByManagerId(int? managerId,int? userId,int? warehouseId = null);
    }
}
