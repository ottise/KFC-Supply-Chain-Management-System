using Inventory.Application.DTOs;
using Inventory.Application.DTOs.Customer;

namespace Inventory.Application.IServices;

public interface ICustomerService
{
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequest request);
    Task<CustomerDto> UpdateCustomerAsync(UpdateCustomerRequest request, int id);
    Task<bool> SoftDeleteCustomerAsync(int id);
    Task<bool> ReactivateCustomerAsync(int id);
    Task<CustomerDto> GetCustomerByIdAsync(int id );
    Task<PagedResultDto<CustomerDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null);
}
