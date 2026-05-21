using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface ICustomerRepository
{
    //crud
    Task<Customer> CreateCustomerAsync(Customer request);
    Task<Customer> UpdateCustomerAsync(Customer request);
    Task<Customer?> SoftDeleteCustomerAsync(int id);
    Task<Customer?> ReactivateCustomerAsync(int id);
    Task<Customer?> GetCustomerByIdAsync(int id);
    Task<(IEnumerable<Customer> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null);


    //misc
    Task<Customer?> CustomerPhoneExistAsync(string phone);
    Task<Customer?> CustomerEmailExistAsync(string email);
}
