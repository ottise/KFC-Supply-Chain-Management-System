using Inventory.Application.DTOs;
using Inventory.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Inventory.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;

    public WarehousesController(IWarehouseService warehouseService)
    {
        _warehouseService = warehouseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] bool? isActive = null, [FromQuery] string? search = null, [FromQuery] int? managerId = null)
    {
        var result = await _warehouseService.GetPaginatedAsync(page, pageSize, isActive, search, managerId);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllNoPaging()
    {
        var result = await _warehouseService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var warehouse = await _warehouseService.GetByIdAsync(id);
        if (warehouse == null)
        {
            return NotFound(new { message = $"The warehouse with ID {id} was not found." });
        }

        return Ok(warehouse);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseDto dto)
    {
        var warehouse = await _warehouseService.CreateAsync(dto);
        return StatusCode(201, new
        {
            message = "Warehouse created successfully.",
            warehouse
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateWarehouseDto dto)
    {
        var updated = await _warehouseService.UpdateAsync(id, dto);
        return Ok(new
        {
            message = "Warehouse updated successfully.",
            warehouse = updated
        });
    }

    [HttpPatch("{id:int}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _warehouseService.DeactivateAsync(id);
        return Ok(new { message = "Warehouse deactivated successfully." });
    }

    [HttpPatch("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        await _warehouseService.ActivateAsync(id);
        return Ok(new { message = "Warehouse activated successfully." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _warehouseService.DeleteAsync(id);
        return Ok(new { message = $"Warehouse with ID {id} has been deleted successfully." });
    }
 
    private int? GetManagerIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "ManagerId");
            if (int.TryParse(claim?.Value, out var managerId))
                return managerId;

            return null;
        }

    private int? GetUserIdFromClaims()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        return int.TryParse(claim?.Value, out var userId) ? userId : null;
    }



    [HttpGet("all/warehouse/managerId")]
    public async Task<IActionResult> GetWarehousesForCurrentUser()
    {
        var managerId = GetManagerIdFromClaims();
        var userId = GetUserIdFromClaims();

        if (!managerId.HasValue && !userId.HasValue)
            return BadRequest("Không tìm thấy thông tin managerId hoặc userId trong claims");


        try
        {
            var warehouses = managerId.HasValue
                ? await _warehouseService.GetWarehousesByManagerIdAsync(managerId.Value)
                : await _warehouseService.GetWarehousesByManagerIdAsync(userId.Value);

            if (warehouses == null || !warehouses.Any())
                return NotFound("Không tìm thấy kho nào cho user/manager hiện tại");

            var response = warehouses.Select(w => new WarehouseDto
            {
                Id = w.Id,
                WarehouseCode = w.WarehouseCode,
                Name = w.Name,
                Address = w.Address,
                Phone = w.Phone,
                Email = w.Email,
                ManagerId = w.ManagerId,
                WarehouseType = w.WarehouseType,
                AreaSqm = w.AreaSqm,
                IsActive = w.IsActive ?? false,
                Notes = w.Notes,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            });

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }


    }
       
    } 
