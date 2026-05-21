using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<IEnumerable<Product>> GetAllActiveAsync();
    Task<IEnumerable<Product>> GetAllArchivedAsync();
    Task<IEnumerable<Product>> GetByLocationIdAsync(int locationId);
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetByCodeAsync(string code);
    Task<int> GetNextSequenceAsync(string productType, string categoryCode);
    Task AddAsync(Product product);
    void Update(Product product);
}
