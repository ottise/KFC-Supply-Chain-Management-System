using Inventory.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Inventory.Application.IRepositories
{
    public interface IProductWarehouseRepository
    {
        Task<List<ProductWarehouse>> GetAllAsync(int? managerId = null);
        Task<List<ProductWarehouse>> GetByWarehouseIdAsync(int warehouseId);
        Task<ProductWarehouse?> GetByIdAsync(int id);
        Task<ProductWarehouse?> GetByProductAndWarehouseAsync(int productId, int warehouseId);
        Task AddAsync(ProductWarehouse productWarehouse);
        Task UpdateAsync(ProductWarehouse productWarehouse);
    }
}
