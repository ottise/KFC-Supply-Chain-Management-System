using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices
{
    public interface ICategoryService
    {
        Task<List<Category>> GetAllCategoryAsync();
        Task<List<CategoryTreeDto>> GetTreeAsync();
        Task<List<CategoryTreeDto>> GetSubTreeAsync(int parentId);
        Task<Category?> GetByIdAsync(int id);
        Task<Category?> GetByNameAsync(string name);
        Task<List<Category>> GetActiveCategoryAsync();
        Task<List<Category>> GetInactiveCategoryAsync();
        Task<List<Category>> GetAllChildIdsAsync(int parentId);

        Task CreateAsync(CreateCategoryDto dto);

        Task UpdateNameAsync(int id, string name);

        Task ToggleStatusAsync(int id, bool isActive);
    }
}