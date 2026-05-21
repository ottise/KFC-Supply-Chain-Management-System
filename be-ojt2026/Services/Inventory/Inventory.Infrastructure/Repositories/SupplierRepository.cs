using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly InventoryDbContext _context;

        public SupplierRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<Supplier> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null)
        {
            var query = _context.Suppliers.AsQueryable();
            
            if (isActive.HasValue)
            {
                query = query.Where(s => s.IsActive == isActive.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim().ToLower();
                query = query.Where(s =>
                    (s.Name != null && s.Name.ToLower().Contains(searchTerm)) ||
                    (s.Phone != null && s.Phone.ToLower().Contains(searchTerm)) ||
                    (s.Email != null && s.Email.ToLower().Contains(searchTerm)) ||
                    (s.ContactPerson != null && s.ContactPerson.ToLower().Contains(searchTerm)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
        public async Task<Supplier> CreateSupplierAsync(Supplier supplier)
        {
            await _context.Suppliers.AddAsync(supplier);
            return supplier;
        }

        public async Task<Supplier?> SoftDeleteSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return null;
            }

            supplier.IsActive = false;
            _context.Suppliers.Update(supplier);
            return supplier;
        }
        public async Task<Supplier?> ReactivateSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return null;
            }

            supplier.IsActive = true;
            _context.Suppliers.Update(supplier);
            return supplier;
        }

        public async Task<Supplier?> CheckExistSupplierAsync(string phone, string email, string name)
        {
            return await _context.Suppliers
                .Where(s => s.Email == email || s.Phone == phone || s.Name == name)
                .FirstOrDefaultAsync();
        }


        public async Task<Supplier> UpdateSupplierAsync(Supplier request)
        {
            _context.Suppliers.Update(request);
            return await Task.FromResult(request);
        }

        public async Task<Supplier?> GetSupplierByIdAsync(int id)
        {
            return await _context.Suppliers
                .Where(s => s.Id == id && s.IsActive == true)
                .FirstOrDefaultAsync();
        }

        public async Task<Supplier?> GetSupplierById(int id)
        {
            return await _context.Suppliers.FindAsync(id);
        }

    }
}
