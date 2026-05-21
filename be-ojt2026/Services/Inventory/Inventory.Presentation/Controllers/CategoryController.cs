using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Inventory.Presentation.Controllers
{
    [ApiController]
    [Route("api/categories")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _categoryService.GetAllCategoryAsync();
            return Ok(result);
        }

        [HttpGet("tree")]
        public async Task<IActionResult> GetFullTree()
        {
            var result = await _categoryService.GetTreeAsync();
            return Ok(result);
        }

        [HttpGet("{id:int}/tree")]
        public async Task<IActionResult> GetSubTree(int id)
        {
            var result = await _categoryService.GetSubTreeAsync(id);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _categoryService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpGet("{id:int}/children")]
        public async Task<IActionResult> GetAllChildren(int id)
        {
            var result = await _categoryService.GetAllChildIdsAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            await _categoryService.CreateAsync(dto);
            return StatusCode(201, new { message = "Category created successfully", data = dto });
        }

        [HttpPut("{id:int}/name")]
        public async Task<IActionResult> UpdateName(int id, [FromBody] string name)
        {
            await _categoryService.UpdateNameAsync(id, name);
            return NoContent();
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> ToggleStatus(int id, [FromQuery] bool isActive)
        {
            await _categoryService.ToggleStatusAsync(id, isActive);
            return Ok(new { message = $"Status updated to {(isActive ? "Active" : "Inactive")}" });
        }
    }
}