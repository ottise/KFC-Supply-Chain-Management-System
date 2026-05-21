using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;
using BuildingBlocks.Exceptions;

namespace Inventory.Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }


        public async Task<List<Category>> GetAllCategoryAsync()
        {
            return await _unitOfWork.Category.GetAllCategoriesAsync();
        }

        public async Task<List<CategoryTreeDto>> GetTreeAsync()
        {
            return await _unitOfWork.Category.GetCategoryTreeAsync();
        }

        public async Task<List<CategoryTreeDto>> GetSubTreeAsync(int parentId)
        {
            var tree = await _unitOfWork.Category.GetSubTreeAsync(parentId);
            if (tree == null || !tree.Any())
                throw new NotFoundException($"No branch found for Category ID {parentId}.");

            return tree;
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            var category = await _unitOfWork.Category.GetCategoryByIdAsync(id);
            if (category == null)
                throw new NotFoundException($"The category with ID {id} was not found.");

            return category;
        }

        public async Task<Category?> GetByNameAsync(string name)
        {
            var category = await _unitOfWork.Category.GetCategoryByNameAsync(name);
            if (category == null)
                throw new NotFoundException($"No category found with the name '{name}'.");

            return category;
        }

        public async Task<List<Category>> GetActiveCategoryAsync()
        {
            return await _unitOfWork.Category.GetActiveCategoryAsync();
        }

        public async Task<List<Category>> GetInactiveCategoryAsync()
        {
            return await _unitOfWork.Category.GetInactiveCategoryAsync();
        }

        public async Task<List<Category>> GetAllChildIdsAsync(int parentId)
        {
            var exists = await _unitOfWork.Category.GetCategoryByIdAsync(parentId);
            if (exists == null)
                throw new NotFoundException($"Parent category {parentId} does not exist.");

            return await _unitOfWork.Category.GetAllChildIds(parentId);
        }


        public async Task CreateAsync(CreateCategoryDto dto)
        {
            if (dto.ParentId.HasValue && dto.ParentId.Value <= 0) dto.ParentId = null;
            dto.Name = dto.Name.Trim();

            var existing = await _unitOfWork.Category.GetCategoryByNameAsync(dto.Name);
            if (existing != null)
                throw new ConflictException($"Conflict: A category with the name '{dto.Name}' already exists.");

            if (dto.ParentId.HasValue)
            {
                var parent = await _unitOfWork.Category.GetCategoryByIdAsync(dto.ParentId.Value);
                if (parent == null)
                    throw new NotFoundException($"Assignment failed: Parent category {dto.ParentId} not found.");

                if (!parent.IsActive)
                    throw new BadRequestException("Dependency error: Cannot create a sub-category under an inactive parent.");
            }

            await _unitOfWork.Category.AddCategoryAsync(dto);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateNameAsync(int id, string name)
        {
            name = name.Trim();

            var category = await _unitOfWork.Category.GetCategoryByIdAsync(id);
            if (category == null)
                throw new NotFoundException($"Update failed: Category {id} not found.");

            var duplicate = await _unitOfWork.Category.GetCategoryByNameAsync(name);
            if (duplicate != null && duplicate.Id != id)
                throw new ConflictException($"The name '{name}' is already assigned to another category.");

            await _unitOfWork.Category.UpdateCategoryNameAsync(id, name);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task ToggleStatusAsync(int id, bool isActive)
        {
            var category = await _unitOfWork.Category.GetCategoryByIdAsync(id);
            if (category == null)
                throw new NotFoundException($"Status update failed: Category {id} not found.");

            if (isActive && category.ParentId.HasValue)
            {
                var parent = await _unitOfWork.Category.GetCategoryByIdAsync(category.ParentId.Value);
                if (parent != null && !parent.IsActive)
                    throw new BadRequestException("Dependency error: Cannot activate this category while its parent is disabled.");
            }

            await _unitOfWork.Category.UpdateStatusRecursive(id, isActive);

          
            await _unitOfWork.SaveChangesAsync();
        }
    }
}