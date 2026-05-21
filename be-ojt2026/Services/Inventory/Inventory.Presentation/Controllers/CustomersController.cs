using Inventory.Application.DTOs.Customer;
using Inventory.Application.IServices;
using Inventory.Application.Validations.Customer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Inventory.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
[SwaggerTag("Manage Customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }


    //get all customers with pagination
    [HttpGet]
    public async Task<IActionResult> GetAllCustomer([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] bool? isActive = null, [FromQuery] string? search = null)
    {
        try
        {
            var customers = await _customerService.GetPaginatedAsync(page, pageSize, isActive, search);
            return Ok(customers);
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

    //get customer by id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCustomerById([FromRoute] int id)
    {
        try
        {
            var customer = await _customerService.GetCustomerByIdAsync(id);
            return Ok(customer);
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

    //create customer
    [HttpPost]
     public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
     {
        var validation = new CreateCustomerValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var createdCustomer = await _customerService.CreateCustomerAsync(request);
            return CreatedAtAction(
                nameof(GetCustomerById),
                new { id = createdCustomer.Id },
                createdCustomer);
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


    //update customer by id
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer([FromRoute] int id, [FromBody] UpdateCustomerRequest request)
    {
        var validation = new UpdateCustomerValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var updatedCustomer = await _customerService.UpdateCustomerAsync(request, id);
            return Ok(updatedCustomer);
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

    //soft delete customer
    [HttpDelete("{id}")]
    public async Task<IActionResult> SoftDeleteCustomerAsync([FromRoute] int id)
     {
        try
        {
            await _customerService.SoftDeleteCustomerAsync(id);
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


    //reactivate customer
    [HttpPost("{id}/reactivate")]
    public async Task<IActionResult> ReactivateCustomer([FromRoute] int id)
     {
        try
        {
            await _customerService.ReactivateCustomerAsync(id);
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
