using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly InventoryDbContext _context;

    public CustomerRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<Customer> CreateCustomerAsync(Customer request)
    {
        await _context.Customers.AddAsync(request);
        return request;
    }

    public async Task<Customer?> CustomerEmailExistAsync(string email)
    {
            return await _context.Customers
                .Where(c => c.Email == email)
                .Where(c => c.IsActive)
                .FirstOrDefaultAsync();
    }

    public async Task<Customer?> CustomerPhoneExistAsync(string phone)
    {
        return await _context.Customers
            .Where(c => c.Phone == phone)
            .Where(c => c.IsActive)
            .FirstOrDefaultAsync();
    }

    public async Task<Customer?> GetCustomerByIdAsync(int id)
    {
        return await _context.Customers.FirstOrDefaultAsync(x => x.Id == id && x.IsActive == true);
    }

    public async Task<(IEnumerable<Customer> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null)
    {
        var query = _context.Customers.AsQueryable();
        
        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(c =>
                (c.CustomerName != null && c.CustomerName.ToLower().Contains(searchTerm)) ||
                (c.Email != null && c.Email.ToLower().Contains(searchTerm)) ||
                (c.Phone != null && c.Phone.ToLower().Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Customer?> ReactivateCustomerAsync(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
        {
            return null;
        }
        customer.IsActive = true;
        _context.Customers.Update(customer);
        return customer;
    }

    public async Task<Customer?> SoftDeleteCustomerAsync(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
        {
            return null;
        }
        customer.IsActive = false;
        _context.Customers.Update(customer);
        return customer;
    }

    public async Task<Customer> UpdateCustomerAsync(Customer request)
    {
        _context.Customers.Update(request);
         return await Task.FromResult(request);
    }

}
