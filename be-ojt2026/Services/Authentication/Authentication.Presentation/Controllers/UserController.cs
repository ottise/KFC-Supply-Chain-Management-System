using Authentication.Application.DTOs.Common;
using Authentication.Application.DTOs.User;
using Authentication.Application.IServices;
using Authentication.Application.Validations.User;
using BuildingBlocks.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace Authentication.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userservice;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserService userservice,
            ILogger<UserController> logger)
        {
            _userservice = userservice;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        [SwaggerOperation(Summary = "Get a paginated list of all users (Logged-in users only)")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10,
            [FromQuery] bool? isActive = null, [FromQuery] string? search = null, [FromQuery] int? roleId = null, [FromQuery] bool? isActiveEmail = null, [FromQuery] bool? isUnassignedManager = null)
        {
            try
            {
                var pagedResult = await _userservice.GetPaginatedAsync(page, pageSize, isActive, search, roleId, isActiveEmail, isUnassignedManager);
                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi lấy danh sách người dùng" });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        [SwaggerOperation(Summary = "Get details of a specific user by ID (Logged-in users only)")]
        public async Task<IActionResult> GetUserById([FromRoute] int id)
        {
            try
            {
                var user = await _userservice.GetUserByIdAsync(id);
                return Ok(user);
            }
            catch (NotFoundException ex)

            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi kiếm user" });
            }
        }

        [HttpPost]
        [SwaggerOperation(Summary = "Create a new user account for Admin (use getall-role so choose roleid / require real email)")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var validation = new CreateUserValidation();
            var validationResult = await validation.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var result = await _userservice.CreateUserAsync(request);
                return CreatedAtAction(nameof(GetUserById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return Conflict(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, new ErrorResponse { Message = "Lỗi tạo người dùng" });
            }
        }

        [HttpPut("{id}")]
        [SwaggerOperation(Summary = "Update user info")]
        public async Task<IActionResult> UpdateUser([FromRoute] int id, [FromBody] UpdateUserRequest request)
        {
            var validation = new UpdateUserValidation();
            var validationResult = await validation.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var result = await _userservice.UpdateUserAsync(request, id);

                if (result == null)
                {
                    return NotFound(new ErrorResponse { Message = "Không tìm thấy người dùng" });
                }

                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user update for ID {UserId}", id);
                return StatusCode(500, new ErrorResponse { Message = "Lỗi cập nhật người dùng" });
            }
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(Summary = "Soft delete a user account (Admin only)")]
        public async Task<IActionResult> SoftDeleteUser(int id)
        {
            var result = await _userservice.SoftDeleteUserAsync(id);
            if (!result) return NotFound(new ErrorResponse { Message = "Không tìm thấy người dùng" });
            return NoContent();
        }


        [HttpPost("{id}/reactivate")]
        [SwaggerOperation(Summary = "Reactivate a locked/deleted user account (Admin only)")]
        public async Task<IActionResult> ReactivateUser(int id)
        {
            var result = await _userservice.ReactivateUserAsync(id);
            if (!result) return NotFound(new ErrorResponse { Message = "Không tìm thấy người dùng" });
            return NoContent();
        }

        [HttpPut("{id}/password")]
        public async Task<IActionResult> UpdateUserPassword([FromRoute] int id, [FromBody] UpdateUserPasswordRequest request)
        {
            var validation = new UpdateUserPasswordValidation();
            var validationResult = await validation.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
            }

            try
            {
                var result = await _userservice.UpdateUserPasswordAsync(request, id);

                if (result == null)
                {
                    return NotFound(new ErrorResponse { Message = "Không tìm thấy người dùng" });
                }

                return Ok(new { message = "Cập nhật mật khẩu người dùng thành công" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user update for ID {UserId}", id);
                return StatusCode(500, new ErrorResponse { Message = "Lỗi cập nhật người dùng" });
            }
        }


        [HttpPut("{id}/user-role(admin)")]
        [SwaggerOperation(Summary = "Update user info")]
        public async Task<IActionResult> UpdateUserForAdmin([FromRoute] int id, [FromBody] UpdateUserForAdminRequest request)
        {
            try
            {
                var result = await _userservice.UpdateUserForAdminAsync(request, id);

                if (result == null)
                {
                    return NotFound(new ErrorResponse { Message = "Không tìm thấy người dùng" });
                }

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user update for ID {UserId}", id);
                return StatusCode(500, new ErrorResponse { Message = "Lỗi cập nhật người dùng" });
            }
        }




        [HttpPut("{staffId}/assign-manager/{managerId}")]
        [SwaggerOperation(Summary = "Assign a manager to a staff user (Admin/Manager only)")]
        public async Task<IActionResult> AssignManager(int staffId, int managerId)
        {
            try
            {
                await _userservice.AssignManagerIdAsync(staffId, managerId);
                return Ok(new { message = "Gán quản lý thành công" });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (ForbiddenException ex)
            {
                return StatusCode(403, new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning manager {ManagerId} to staff {StaffId}", managerId, staffId);
                return StatusCode(500, new ErrorResponse { Message = "Lỗi gán quản lý" });
            }
        }


        [HttpPut("{staffId}/unassign-manager")]
        [SwaggerOperation(Summary = "Unassign manager from a staff user (Admin can unassign anyone; Manager only their own staff)")]
        public async Task<IActionResult> UnassignManager(int staffId)
        {
            try
            {
                var actingUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var actingRoleName = User.FindFirst(ClaimTypes.Role)?.Value;
                if (string.IsNullOrWhiteSpace(actingUserIdClaim) || string.IsNullOrWhiteSpace(actingRoleName))
                {
                    return Unauthorized(new ErrorResponse { Message = "Người dùng không có quyền thực hiện hành động này." });
                }
                var actingUserId = int.Parse(actingUserIdClaim);
                await _userservice.UnAssignManagerAsync(staffId, actingUserId, actingRoleName);
                return Ok(new { message = "Hủy gán quản lý thành công" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (ForbiddenException ex)
            {
                return StatusCode(403, new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unassigning manager from staff {StaffId}", staffId);
                return StatusCode(500, new ErrorResponse { Message = "Lỗi hủy gán quản lý" });
            }
        }



        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var userId = GetUserIdFromClaims();

            try
            {
                var employees = await _userservice.GetEmployeesByManagerIdAsync(userId);
                return Ok(employees);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        private int GetUserIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            if (claim == null || !int.TryParse(claim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Không tìm thấy userId trong claims");
            }
            return userId;
        }

    }
}



