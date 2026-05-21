using Inventory.Application.IRepositories;
using Inventory.Domain.Common.Constants;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Inventory.Infrastructure.Repositories
{
    public class InventoryAdjustmentRepository : IInventoryAdjustmentRepository
    {
        private readonly InventoryDbContext _context;

        public InventoryAdjustmentRepository(InventoryDbContext context)
        {
            _context = context;
        }
        public async Task UpdateAdjustment(InventoryAdjustment adjustment)
        {
            if (adjustment == null)
                throw new ArgumentNullException(nameof(adjustment));

            _context.InventoryAdjustments.Update(adjustment);
            await _context.SaveChangesAsync();
        }

        public async Task<List<InventoryAdjustment>> GetAllAsync()
        {
            return await _context.InventoryAdjustments.ToListAsync();
        }

        public async Task<InventoryAdjustment?> GetInventoryAdjustmentById(int id)
        {
            return await _context.InventoryAdjustments.FindAsync(id);
        }
        public async Task<InventoryAdjustment> AddInventoryAdjustment()
        {
            var year = DateTime.UtcNow.Year;
            var count = await _context.InventoryAdjustments
                                      .CountAsync(x => x.CreatedAt.HasValue && x.CreatedAt.Value.Year == year);

            var adjustment = new InventoryAdjustment
            {
                AdjustmentNo = $"ADJ-{year}-{count + 1:D3}",
                Status = InventoryAdjustmentStatus.Pending.ToString(),
                CreatedAt = DateTime.UtcNow
            };

            await _context.InventoryAdjustments.AddAsync(adjustment);
            return adjustment;
        }


        public async Task CompletedInventoryAdjustmentStatus(int id)
        {
            var adjustment = await GetInventoryAdjustmentById(id);
            if (adjustment != null)
            {
                adjustment.Status = InventoryAdjustmentStatus.Completed.ToString();
                adjustment.CompletedAt = DateTime.UtcNow;
                adjustment.AssigneeId = null;
                _context.InventoryAdjustments.Update(adjustment);
            }
        }
        public async Task<IEnumerable<InventoryAdjustment>> GetAdjustmentsByLocationAsync(int locationId)
        {
            return await _context.InventoryAdjustments
                                 .Where(adj => _context.InventoryAdjustmentItems
                                     .Any(item => item.AdjustmentId == adj.Id && item.LocationId == locationId))
                                 .ToListAsync();
        }

        public async Task<InventoryAdjustment?> GetByIdAsync(int id)
        {
            return await _context.Set<InventoryAdjustment>()
                                 .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<InventoryAdjustment>> GetInventoryAdjustmentByAssigneeIdAsync(int assigneeId)
        {
            return await _context.InventoryAdjustments
                .Where(adj => adj.AssigneeId == assigneeId)
                .ToListAsync();
        }
       

        }
    }
