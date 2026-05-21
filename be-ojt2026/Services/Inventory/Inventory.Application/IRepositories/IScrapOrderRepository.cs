using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface IScrapOrderRepository
{
    Task<IEnumerable<ScrapOrder>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ScrapOrder?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ScrapOrder?> GetByIdWithItemsAsync(int id, CancellationToken cancellationToken = default);
    Task AddAsync(ScrapOrder order, CancellationToken cancellationToken = default);
    Task UpdateAsync(ScrapOrder order);
    Task DeleteAsync(ScrapOrder order);
    Task<int> CountByStatusAsync(string status, CancellationToken cancellationToken = default);
}
