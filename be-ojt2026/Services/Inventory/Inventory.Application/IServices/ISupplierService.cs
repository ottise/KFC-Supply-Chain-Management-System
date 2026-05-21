using Inventory.Application.DTOs.Supplier;
using Inventory.Application.DTOs.Common;
using Inventory.Domain.Entities;
using Inventory.Application.DTOs;

namespace Inventory.Application.IServices
{
    public interface ISupplierService
    {
        Task<SupplierDto> CreateSupplierAsync(CreateSupplierRequest request);
        Task<SupplierDto> UpdateSupplierAsync(UpdateSupplierRequest request, int id);
        Task<bool> SoftDeleteSupplierAsync(int id);
        Task<bool> ReactivateSupplierAsync(int id);
        Task<SupplierDto?> GetSupplierByIdAsync(int id);
        Task<PagedResultDto<SupplierDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null);
        Task<Supplier?> GetSupplierById(int id);
    }
}
