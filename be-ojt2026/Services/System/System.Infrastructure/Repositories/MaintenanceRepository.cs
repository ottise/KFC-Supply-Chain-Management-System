using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Domain.Entities;
using System.Domain.Enums;
using System.Application.IRepositories;
using System.Infrastructure.Data;

namespace System.Infrastructure.Repositories
{
    public class MaintenanceRepository : IMaintenanceRepository
    {
        private readonly SystemDbContext _context;

        public MaintenanceRepository(SystemDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SystemMaintenance>> GetAllAsync()
        {
            return await _context.SystemMaintenances
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<SystemMaintenance?> GetByIdAsync(string id)
        {
            return await _context.SystemMaintenances.FindAsync(id);
        }

        public async Task<SystemMaintenance?> GetActiveMaintenanceAsync()
        {
            return await _context.SystemMaintenances
                .Where(m => m.Status == MaintenanceStatus.Ongoing)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<SystemMaintenance>> GetByStatusAsync(MaintenanceStatus status)
        {
            return await _context.SystemMaintenances
                .Where(m => m.Status == status)
                .ToListAsync();
        }

        public async Task AddAsync(SystemMaintenance maintenance)
        {
            await _context.SystemMaintenances.AddAsync(maintenance);
        }

        public async Task UpdateAsync(SystemMaintenance maintenance)
        {
            _context.Entry(maintenance).State = EntityState.Modified;
            await Task.CompletedTask;
        }

        public async Task<string> GetLastTicketIdAsync()
        {
            // Fetch all IDs that start with "TICK-" and parse in memory
            // This fixes lexicographic bug where "TICK-99" > "TICK-100"
            var allTicketIds = await _context.SystemMaintenances
                .Where(m => m.Id != null && m.Id.StartsWith("TICK-"))
                .Select(m => m.Id)
                .ToListAsync();

            string lastId = string.Empty;
            foreach (var id in allTicketIds)
            {
                if (id.Length > 5 && int.TryParse(id.Substring(5), out int num))
                {
                    // Extract current last number for comparison
                    int lastNum = 0;
                    if (lastId.Length > 5 && int.TryParse(lastId.Substring(5), out int lastNumParsed))
                    {
                        lastNum = lastNumParsed;
                    }
                    if (num > lastNum)
                    {
                        lastId = id;
                    }
                }
            }
            return lastId;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
