using Authentication.Application.DTOs.Roles;
using Authentication.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Authentication.Application.DTOs.Common;
using Swashbuckle.AspNetCore.Annotations;
using Authentication.Application.Validations.Roles;

namespace Authentication.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly ILogger<UserController> _logger;

        public RoleController(
            IRoleService roleService, 
            ILogger<UserController> logger)
        {
            _roleService = roleService;
            _logger = logger;
        }

        [HttpGet]
        [SwaggerOperation(Summary = "Get a list of all roles in the system (Admin only)")]
        public async Task<IActionResult> GetAllRoles()
        {
            try
            {
                var roles = await _roleService.GetAllRolesAsync();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all roles");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi lấy danh sách vai trò" });
            }
        }

        [HttpGet("{id}")]
        [SwaggerOperation(Summary = "Get the details of a specific Role by ID (Admin only)")]
        public async Task<IActionResult> GetRoleById(int id)
        {
            try
            {
                var role = await _roleService.GetRoleByIdAsync(id);
                return Ok(role);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest role)
        {
            var validation = new CreateRoleValidation();
            var validationResult = await validation.ValidateAsync(role);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var createdRole = await _roleService.CreateRoleAsync(role);
                return CreatedAtAction(nameof(GetRoleById), new { id = createdRole.Id }, createdRole);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi tạo vai trò" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole([FromRoute] int id, [FromBody] UpdateRoleRequest role)
        {
            var validation = new UpdateRoleValidation();
            var validationResult = await validation.ValidateAsync(role);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var updatedRole = await _roleService.UpdateRoleAsync(role, id);
                return Ok(updatedRole);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi cập nhật vai trò" });
            }
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(Summary = "Permanently remove a Role from the system (Admin only)")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            try
            {
                var result = await _roleService.DeleteRoleAsync(id);
                if (!result)
                {
                    return NotFound(new ErrorResponse { Message = "Không tìm thấy vai trò" });
                }
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi xóa vai trò" });
            }
        }
    }
}
