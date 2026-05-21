using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Inventory.Infrastructure.Repositories
{
    public class ProductWarehouseRepository : IProductWarehouseRepository
    {
        private readonly InventoryDbContext _context;

        public ProductWarehouseRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProductWarehouse>> GetAllAsync(int? managerId = null)
        {
            var query = _context.ProductWarehouses
                .Include(pw => pw.Product)
                    .ThenInclude(p => p.Category)
                .Include(pw => pw.Product)
                    .ThenInclude(p => p.BaseUom)
                .Include(pw => pw.Warehouse)
                .Include(pw => pw.ReorderingRules)
                .AsQueryable();

            if (managerId.HasValue)
            {
                query = query.Where(pw => pw.Warehouse.ManagerId == managerId.Value);
            }

            return await query.ToListAsync();
        }

        public async Task<List<ProductWarehouse>> GetByWarehouseIdAsync(int warehouseId)
        {
            return await _context.ProductWarehouses
                .Include(pw => pw.Product)
                    .ThenInclude(p => p.Category)
                .Include(pw => pw.Product)
                    .ThenInclude(p => p.BaseUom)
                .Include(pw => pw.ReorderingRules)
                .Where(pw => pw.WarehouseId == warehouseId && pw.IsActive == true)
                .ToListAsync();
        }

        public async Task<ProductWarehouse?> GetByIdAsync(int id)
        {
            return await _context.ProductWarehouses
                .Include(pw => pw.Product)
                    .ThenInclude(p => p.Category)
                .Include(pw => pw.Product)
                    .ThenInclude(p => p.BaseUom)
                .Include(pw => pw.Warehouse)
                .Include(pw => pw.ReorderingRules)
                .FirstOrDefaultAsync(pw => pw.Id == id);
        }

        public async Task<ProductWarehouse?> GetByProductAndWarehouseAsync(int productId, int warehouseId)
        {
            return await _context.ProductWarehouses
                .FirstOrDefaultAsync(pw => pw.ProductId == productId && pw.WarehouseId == warehouseId);
        }

        public async Task AddAsync(ProductWarehouse productWarehouse)
        {
            await _context.ProductWarehouses.AddAsync(productWarehouse);
        }

        public async Task UpdateAsync(ProductWarehouse productWarehouse)
        {
            _context.ProductWarehouses.Update(productWarehouse);
            await Task.CompletedTask;
        }
    }
}
