using Inventory.Application.DTOs;
using Inventory.Application.DTOs.DashBoard;
using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories
{
    public interface ICategoryRepository
    {
        Task<List<Category>> GetAllCategoriesAsync();
        Task<List<CategoryTreeDto>> GetCategoryTreeAsync();
        Task<List<CategoryTreeDto>> GetSubTreeAsync(int parentId);
        Task<List<Category>> GetActiveCategoryAsync();
        Task<List<Category>> GetInactiveCategoryAsync();

        Task<Category?> GetCategoryByIdAsync(int id);
        Task<Category?> GetCategoryByNameAsync(string name);

        Task<List<Category>> GetAllChildIds(int parentId);

        Task AddCategoryAsync(CreateCategoryDto dto);
        Task UpdateCategoryNameAsync(int id, string name);
        Task UpdateStatusRecursive(int id, bool isActive);

        //dashboard
        Task<List<CategoryProductCountDto>> GetProductCountByParentIdAsync(int? parentId);
        Task<List<Category>> GetParentCategoriesAsync();
    }
}