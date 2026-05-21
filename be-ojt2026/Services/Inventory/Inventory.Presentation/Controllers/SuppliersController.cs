using Inventory.Application.DTOs.Supplier;
using Inventory.Application.IServices;
using Inventory.Application.Validations.Supplier;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Microsoft.AspNetCore.Authorization;

namespace Inventory.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
[SwaggerTag("Manage Suppliers")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    [SwaggerOperation(Summary = "Get all suppliers with pagination and filtering")]
    public async Task<IActionResult> GetAllSuppliers([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] bool? isActive = null, [FromQuery] string? search = null)
    {
        try
        {
            var suppliers = await _supplierService.GetPaginatedAsync(page, pageSize, isActive, search);
            return Ok(suppliers);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [SwaggerOperation(Summary = "Get supplier by ID")]
    public async Task<IActionResult> GetSupplierById(int id)
    {
        try
        {
            var supplier = await _supplierService.GetSupplierByIdAsync(id);
            return Ok(supplier);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost]
    [SwaggerOperation(Summary = "Create a new supplier")]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierRequest request)
    {
        var validation = new CreateSupplierValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var supplier = await _supplierService.CreateSupplierAsync(request);
            return CreatedAtAction(nameof(GetSupplierById), new { id = supplier.Id }, supplier);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [SwaggerOperation(Summary = "Update supplier information")]
    public async Task<IActionResult> UpdateSupplier([FromRoute] int id, [FromBody] UpdateSupplierRequest request)
    {
        var validation = new UpdateSupplierValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var supplier = await _supplierService.UpdateSupplierAsync(request, id);
            return Ok(supplier);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "Soft delete a supplier")]
    public async Task<IActionResult> SoftDeleteSupplier(int id)
    {
        try
        {
            await _supplierService.SoftDeleteSupplierAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{id}/reactivate")]
    [SwaggerOperation(Summary = "Reactivate a deleted supplier")]
    public async Task<IActionResult> ReactivateSupplier(int id)
    {
        try
        {
            await _supplierService.ReactivateSupplierAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
