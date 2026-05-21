using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Repositories;

public class ScrapOrderRepository : IScrapOrderRepository
{
    private readonly InventoryDbContext _context;

    public ScrapOrderRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ScrapOrder>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ScrapOrders
            .Include(s => s.ScrapOrderItems)
            .Include(s => s.Warehouse)
            .Include(s => s.Location)
            .Include(s => s.ToLocation)
            .OrderBy(s => s.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<ScrapOrder?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ScrapOrders
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<ScrapOrder?> GetByIdWithItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ScrapOrders
            .Include(s => s.ScrapOrderItems)
            .Include(s => s.Warehouse)
            .Include(s => s.Location)
            .Include(s => s.ToLocation)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AddAsync(ScrapOrder order, CancellationToken cancellationToken = default)
    {
        await _context.ScrapOrders.AddAsync(order, cancellationToken);
    }

    public Task UpdateAsync(ScrapOrder order)
    {
        _context.ScrapOrders.Update(order);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ScrapOrder order)
    {
        _context.ScrapOrders.Remove(order);
        return Task.CompletedTask;
    }

    public async Task<int> CountByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        return await _context.ScrapOrders.CountAsync(s => s.Status == status, cancellationToken);
    }
}
