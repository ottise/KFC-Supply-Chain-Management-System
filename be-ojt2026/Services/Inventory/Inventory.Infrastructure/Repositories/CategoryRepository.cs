
using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Application.DTOs;
using Inventory.Infrastructure.Data;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Inventory.Application.DTOs.DashBoard;

namespace Inventory.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly InventoryDbContext _inventoryDb;

        public CategoryRepository(InventoryDbContext inventoryDb)
        {
            _inventoryDb = inventoryDb;
        }

        public async Task<List<Category>> GetAllCategoriesAsync()
        {
            return await _inventoryDb.Categories.ToListAsync();
        }

        public async Task<Category?> GetCategoryByIdAsync(int id)
        {
            return await _inventoryDb.Categories.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Category?> GetCategoryByNameAsync(string name)
        {
            return await _inventoryDb.Categories
                .FirstOrDefaultAsync(a => a.Name.ToLower() == name.ToLower());
        }

        public async Task<List<Category>> GetActiveCategoryAsync()
        {
            return await _inventoryDb.Categories.Where(a => a.IsActive).ToListAsync();
        }

        public async Task<List<Category>> GetInactiveCategoryAsync()
        {
            return await _inventoryDb.Categories.Where(a => !a.IsActive).ToListAsync();
        }

        public async Task AddCategoryAsync(CreateCategoryDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                ParentId = dto.ParentId,
                IsActive = true
            };
            await _inventoryDb.Categories.AddAsync(category);
        }

        public async Task UpdateCategoryNameAsync(int id, string name)
        {
            var category = await GetCategoryByIdAsync(id);
            if (category != null)
            {
                category.Name = name;
            }
        }

        public async Task<List<CategoryTreeDto>> GetCategoryTreeAsync()
        {
            var allCategories = await _inventoryDb.Categories
                .Select(c => new CategoryTreeDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    IsActive = c.IsActive,
                    Children = new List<CategoryTreeDto>()
                }).ToListAsync();

            return MapToTree(allCategories);
        }

        public async Task<List<CategoryTreeDto>> GetSubTreeAsync(int parentId)
        {
            var allCategories = await _inventoryDb.Categories
                .Select(c => new CategoryTreeDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    IsActive = c.IsActive,
                    Children = new List<CategoryTreeDto>()
                }).ToListAsync();

            var root = allCategories.FirstOrDefault(c => c.Id == parentId);
            if (root == null) return new List<CategoryTreeDto>();

            var flatSubtree = new List<CategoryTreeDto>();
            GetFlatChildren(parentId, allCategories, flatSubtree);
            flatSubtree.Add(root);

            return MapToTree(flatSubtree, root.ParentId);
        }
        public async Task UpdateStatusRecursive(int id, bool isActive)
        {
            var allCategories = await _inventoryDb.Categories.ToListAsync();
            var resultList = new List<Category>();

            var root = allCategories.FirstOrDefault(c => c.Id == id);
            if (root != null)
            {
                resultList.Add(root);
                FindChildren(id, allCategories, resultList);

                foreach (var cat in resultList)
                {
                    cat.IsActive = isActive;
                }
            }
        }

        private List<CategoryTreeDto> MapToTree(List<CategoryTreeDto> flatList, int? rootId = null)
        {
            var dict = flatList.ToDictionary(c => c.Id);
            var rootNodes = new List<CategoryTreeDto>();

            foreach (var node in flatList)
            {
                if (node.ParentId == rootId)
                {
                    rootNodes.Add(node);
                }
                else if (dict.TryGetValue(node.ParentId.Value, out var parent))
                {
                    parent.Children.Add(node);
                }
            }
            return rootNodes;
        }

        private void GetFlatChildren(int parentId, List<CategoryTreeDto> all, List<CategoryTreeDto> result)
        {
            var kids = all.Where(c => c.ParentId == parentId).ToList();
            foreach (var k in kids)
            {
                result.Add(k);
                GetFlatChildren(k.Id, all, result);
            }
        }

        private void FindChildren(int parentId, List<Category> all, List<Category> result)
        {
            var kids = all.Where(c => c.ParentId == parentId).ToList();
            foreach (var k in kids)
            {
                result.Add(k);
                FindChildren(k.Id, all, result);
            }
        }

        public async Task<List<Category>> GetAllChildIds(int parentId)
        {
            var all = await _inventoryDb.Categories.ToListAsync();
            var result = new List<Category>();
            var root = all.FirstOrDefault(c => c.Id == parentId);
            if (root != null)
            {
                result.Add(root);
                FindChildren(parentId, all, result);
            }
            return result;
        }

        public async Task<List<CategoryProductCountDto>> GetProductCountByParentIdAsync(int? parentId)
        {
            return await _inventoryDb.Categories
                .Where(c => c.ParentId == parentId && c.IsActive == true)
                .Select(c => new CategoryProductCountDto
                {
                    CategoryId = c.Id,
                    CategoryName = c.Name,
                    ProductCount = _inventoryDb.Products.Count(p => p.CategoryId == c.Id && p.IsActive == true)
                })
                .ToListAsync();
        }

        public async Task<List<Category>> GetParentCategoriesAsync()
        {
            return await _inventoryDb.Categories
                .Where(c => c.ParentId == null  && c.IsActive == true)
                .ToListAsync();
        }
    }
}

