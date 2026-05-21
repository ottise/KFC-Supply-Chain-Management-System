using Inventory.Application.DTOs;
using Inventory.Domain.Entities;
using System.Collections.Generic;

namespace Inventory.Application.IRepositories;

public interface ISupplierRepository
{
    Task<Supplier> CreateSupplierAsync(Supplier supplier);
    Task<Supplier> UpdateSupplierAsync(Supplier request);
    Task<Supplier?> SoftDeleteSupplierAsync(int id);
    Task<Supplier?> ReactivateSupplierAsync(int id);
    Task<Supplier?> GetSupplierByIdAsync(int id);
    Task<(IEnumerable<Supplier> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null);

    //misc
    Task<Supplier?> CheckExistSupplierAsync(string phone, string email, string name);
    Task<Supplier?> GetSupplierById(int id);
}
