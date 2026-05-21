using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UomsController : ControllerBase
{
    private readonly IUomService _uomService;

    public UomsController(IUomService uomService)
    {
        _uomService = uomService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null, [FromQuery] bool? isBaseUnit = null, [FromQuery] string? search = null)
    {
        var result = await _uomService.GetPaginatedAsync(page, pageSize, category, isBaseUnit, search);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllNoPaging()
    {
        var result = await _uomService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _uomService.GetCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("category/{category}")]
    public async Task<IActionResult> GetByCategory(string category, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _uomService.GetByCategoryPaginatedAsync(category, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var uom = await _uomService.GetByIdAsync(id);
        if (uom == null)
            return NotFound(new { message = $"The UOM with ID {id} was not found." });
        return Ok(uom);
    }

    [HttpPost("base-unit")]
    public async Task<IActionResult> CreateBaseUnit([FromBody] CreateBaseUomDto dto)
    {
        var uom = await _uomService.CreateBaseUnitAsync(dto);
        return StatusCode(201, new
        {
            message = "Base unit created successfully.",
            uom
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUomDto dto)
    {
        var uom = await _uomService.CreateAsync(dto);
        return StatusCode(201, new
        {
            message = "UOM created successfully.",
            uom
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateUomDto dto)
    {
        var uom = await _uomService.UpdateAsync(id, dto);
        return Ok(new
        {
            message = "UOM updated successfully.",
            uom
        });
    }

    [HttpPut("{id:int}/base-unit")]
    public async Task<IActionResult> UpdateBaseUnit(int id, [FromBody] UpdateBaseUomDto dto)
    {
        var uom = await _uomService.UpdateBaseUnitAsync(id, dto);
        return Ok(new
        {
            message = "Base unit updated successfully.",
            uom
        });
    }

    [HttpPut("base-unit/category")]
    public async Task<IActionResult> UpdateBaseUnitByCategory([FromQuery] string category, [FromBody] UpdateBaseUomDto dto)
    {
        var uom = await _uomService.UpdateBaseUnitByCategoryAsync(category, dto);
        return Ok(new
        {
            message = "Base unit updated successfully.",
            uom
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _uomService.DeleteAsync(id);
        return Ok(new { message = $"UOM with ID {id} has been deleted successfully." });
    }
}
