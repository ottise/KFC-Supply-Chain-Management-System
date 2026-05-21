using Authentication.Application.DTOs.Login;
using Authentication.Application.IRepositories;
using Authentication.Application.IServices;
using BuildingBlocks.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Authentication.Application.DTOs.Common;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;
using Authentication.Application.Validations.Login;

namespace Authentication.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public AuthController(
        IAuthenticationService authService,
        ILogger<AuthController> logger,
        IUnitOfWork unitOfWork)
    {
        _authService = authService;
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Login to the system")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var validation = new LoginValidation();
        var validationResult = validation.Validate(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var result = await _authService.LoginAsync(request);

            if (result == null)
            {
                return Unauthorized(new ErrorResponse { Message = "Thông tin đăng nhập không hợp lệ" });
            }

            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login attempt for {EmailOrUsername}", request.EmailOrUsername);
            return StatusCode(500, new ErrorResponse { Message = "Lỗi máy chủ nội bộ" });
        }
    }

    [HttpGet("current-profile")]
    [Authorize]
    [SwaggerOperation(Summary = "Get the profile of the currently logged-in User")]
    public IActionResult GetProfile()
    {
        try
        {
            // Get user info from JWT claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var fullname = User.FindFirst("Fullname")?.Value;
            var phone = User.FindFirst("Phone")?.Value;
            var managerId = User.FindFirst("ManagerId")?.Value;

            return Ok(new
            {
                Id = userId,
                Username = username,
                Email = email,
                Fullname = fullname,
                Phone = phone,
                Role = role,
                ManagerId = managerId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, new ErrorResponse { Message = "Lỗi khi lấy thông tin người dùng" });
        }
    }
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Verify OTP code for password reset")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var validation = new VerifyOtpValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var result = await _authService.VerifyOtpAsync(request);
            if (!result.Valid)
            {
                return BadRequest(new ErrorResponse { Message = result.Message });
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during OTP verification");
            return StatusCode(500, new ErrorResponse { Message = "Lỗi xác thực OTP" });
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var validation = new ForgotPasswordValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            await _authService.SendOtpAsync(request);
            return Ok(new { message = "OTP đã được gửi đến email của bạn." });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password attempt for {Email}", request.Email);
            return StatusCode(500, new ErrorResponse { Message = "Lỗi khi gửi OTP quên mật khẩu" });
        }
    }

    [HttpPost("reset-password/otp")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var validation = new ResetPasswordValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            await _authService.ResetPasswordAsync(request);
            return Ok(new { message = "Đặt lại mật khẩu thành công." });
        }
        catch (BadRequestException ex)
        {
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset attempt for {Email}", request.Email);
            return StatusCode(500, new ErrorResponse { Message = "Lỗi đặt lại mật khẩu" });
        }
    }

    [HttpPost("register")]
    [SwaggerOperation(Summary = "user register {required real email}")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var validation = new RegisterValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (ConflictException ex)
        {
            return Conflict(new ErrorResponse { Message = ex.Message });
        }
        catch (BadRequestException ex)
        {
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration attempt for {EmailOrUsername}", request.Email);
            return StatusCode(500, new ErrorResponse { Message = "Lỗi đăng ký tài khoản" });
        }
    }


    [HttpPost("send-verification-email")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Resend email verification code")]
    public async Task<IActionResult> SendVerificationEmail([FromBody] SendVerificationEmailRequest request)
    {
        var validation = new SendVerificationEmailValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            await _authService.SendEmailVerificationAsync(request.Email);
            return Ok(new { message = "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn." });
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
            _logger.LogError(ex, "Error sending verification email to {Email}", request.Email);
            return StatusCode(500, new ErrorResponse { Message = "Lỗi gửi email xác thực" });
        }
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "Verify email address")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var validation = new VerifyEmailValidation();
        var validationResult = await validation.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return StatusCode(422, new ErrorResponse { Message = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)) });
        }

        try
        {
            var result = await _authService.VerifyEmailAsync(request);
            if (!result.Valid)
            {
                return BadRequest(new ErrorResponse { Message = result.Message });
            }
            return Ok(result);
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
            _logger.LogError(ex, "Error during email verification");
            return StatusCode(500, new ErrorResponse { Message = "Lỗi xác thực email" });
        }
    }
}
    