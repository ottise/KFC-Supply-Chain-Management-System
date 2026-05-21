using Authentication.Application.DTOs.Login;
using Authentication.Application.IRepositories;
using Authentication.Application.IServices;
using Authentication.Domain.Common.Constants;
using Authentication.Domain.Entities;
using BuildingBlocks.Exceptions;
using System.Security.Cryptography;

namespace Authentication.Application.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IUserRepository _userrepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwtService;
        private readonly IMailService _mailService;
        private readonly IOtpRepository _otpRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AuthenticationService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IJwtService jwtService,
            IMailService mailService,
            IOtpRepository otpRepository,
            IUnitOfWork unitOfWork)
        {
            _userrepository = userRepository;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
            _mailService = mailService;
            _otpRepository = otpRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            //check username/email
            User? user = await _userrepository.GetUserByUsernameAsync(request.EmailOrUsername);
            if (user == null)
            {
                user = await _userrepository.GetUserByEmailAsync(request.EmailOrUsername);
            }
            if (user == null)
            {
                throw new NotFoundException("Email hoặc tên đăng nhập không tồn tại trong hệ thống.");
            }
            //check if email is active
            if (user.isActiveMail == false)
            {
                throw new UnauthorizedException("Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư để nhận mã xác thực.");
            }
            //check if account is locked
            if (user.Status != "Active")
            {
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            //check password
            if(!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedException("Email hoặc tên đăng nhập không đúng.");
            }

            //generate token
            var token = _jwtService.GenerateToken(user);

            return new LoginResponse
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                Role = user.Role.Name,
                ExpiresAt = DateTime.UtcNow.AddHours(1) // Set token expiration time (e.g., 1 hour)
            };


        }
        public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
        {
            // Check if email already exists
            var existingEmail = await _userrepository.CheckExistEmailAsync(request.Email);
            if (existingEmail != null)
            {
                throw new ConflictException($"Email đã tồn tại trong hệ thống");
            }

            // Check if username already exists
            var existingUsername = await _userrepository.CheckExistUsernameAsync(request.Username);
            if (existingUsername != null)
            {
                throw new ConflictException($"Username đã tồn tại trong hệ thống");
            }

            var roleName = RegisterRole.Staff.ToString();
            var roleId = await _unitOfWork.RoleRepository.GetRoleByNameAsync(roleName);
            if (roleId == null)
            {
                throw new BadRequestException($"Role '{roleName}' không tồn tại.");
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Fullname = request.Fullname,
                Phone = request.Phone,
                RoleId = roleId.Id,
                Status = UserStatus.Pending.ToString(),
                CreatedAt = DateTime.UtcNow,
                isActiveMail = false,
                ManagerId = null
            };

            //save using repository
            await _userrepository.CreateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            //send verify to email
            await SendEmailVerificationAsync(request.Email);

            //get role name since "user.Role.Name" doesnt work
            var roleRepository = _unitOfWork.RoleRepository;
            var role = await roleRepository.GetRoleByIdAsync(user.RoleId);

            return new RegisterResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                Role = role.Name ?? "unknown",
                ManagerId = user.ManagerId,
                IsActiveMail = user.isActiveMail
            };
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            if (request.NewPassword != request.ConfirmPassword)
            {
                throw new BadRequestException("Mật khẩu không trùng nhau, vui lòng thử lại.");
            }
            User user = await ValidateOtpAndGetUserAsync(request.Email, request.OtpCode);

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);

            await _userrepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            await _mailService.SendPasswordChangedMailAsync(request.Email);
        }


        public async Task<VerifyOtpResponse> VerifyOtpAsync(VerifyOtpRequest request)
        {
            var token = await _otpRepository.GetValidOtpAsync(request.OtpCode);
            if (token == null)
            {
                throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn.");
            }

            return new VerifyOtpResponse { Valid = true, Message = "Xác thực email thành công!" };
        }


        public async Task<VerifyEmailResponse> VerifyEmailAsync(VerifyEmailRequest request)
        {
            var user = await _userrepository.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                user = await _userrepository.GetUserByUsernameAsync(request.Email);
            }
            if (user == null)
                throw new NotFoundException("Không tìm thấy email hoặc username trong hệ thống");

            var token = await _unitOfWork.EmailVerificationRepository.GetValidTokenAsync(user.Id, request.OtpCode);
            if (token == null)
                throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn.");

            // Mark token as used
            await _unitOfWork.EmailVerificationRepository.MarkAsUsedAsync(token);

            // Update user status
            user.Status = UserStatus.Active.ToString();
            user.isActiveMail = true;
            await _userrepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return new VerifyEmailResponse { Valid = true, Message = "Xác thực email/username thành công!" };
        }



        //misc

        //send otp verify email
        public async Task SendEmailVerificationAsync(string email)
        {
            var user = await _userrepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new NotFoundException("Không tìm thấy email trong hệ thống");

            if (user.isActiveMail == true)
                throw new BadRequestException("Email đã được xác thực trước đó");

            string otp = GenerateOtp();
            var utcNow = DateTime.UtcNow;
            var token = new EmailVerificationToken
            {
                UserId = user.Id,
                OtpCode = otp,
                CreatedAt = utcNow,
                ExpirationTime = utcNow.AddMinutes(30) //30 min expire
            };

            await _unitOfWork.EmailVerificationRepository.CreateTokenAsync(token);
            await _unitOfWork.SaveChangesAsync();

            await _mailService.SendEmailVerificationMailAsync(email, otp);
        }

        //send otp reset password
        public async Task SendOtpAsync(ForgotPasswordRequest request)
        {
            var user = await _userrepository.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                throw new NotFoundException("Không tìm thấy email trong hệ thống.");
            }

            if (user.Status != "Active")
            {
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Không thể yêu cầu cấp lại mật khẩu.");
            }
            string otp = GenerateOtp();
            var utcNow = DateTime.UtcNow;
            var token = new PasswordResetToken
            {
                UserId = user.Id,
                OtpCode = otp,
                CreatedAt = utcNow,
                ExpirationTime = utcNow.AddMinutes(5) // OTP expires in 5 minutes (UTC)
            };
            await _otpRepository.CreateOtpAsync(token);

            await _mailService.SendOtpMailAsync(request.Email, otp);
        }
        private async Task<User> ValidateOtpAndGetUserAsync(string email, string otpCode)
        {
            var user = await _userrepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new NotFoundException("Không tìm thấy email trong hệ thống.");

            if (user.Status != "Active")
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Không thể thay đổi mật khẩu.");

            var token = await _otpRepository.GetValidTokenAsync(user.Id, otpCode);
            if (token == null)
                throw new BadRequestException("Mã OTP không hợp lệ.");

            await _otpRepository.MarkAsUsedAsync(token);

            return user;
        }
        private string GenerateOtp()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            int code = BitConverter.ToInt32(bytes, 0);
            return Math.Abs(code % 1000000).ToString("D6");
        }
    }
}
