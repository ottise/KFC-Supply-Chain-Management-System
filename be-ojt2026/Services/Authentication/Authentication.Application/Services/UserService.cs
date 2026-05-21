using Authentication.Application.DTOs.Common;
using Authentication.Application.DTOs.User;
using Authentication.Application.IRepositories;
using Authentication.Application.IServices;
using Authentication.Domain.Common.Constants;
using Authentication.Domain.Entities;
using BuildingBlocks.Exceptions;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace Authentication.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userrepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMailService _mailService;
        public UserService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IUnitOfWork unitOfWork,
            IMailService mailService,
            ILogger<UserService> logger)
        {
            _userrepository = userRepository;
            _passwordHasher = passwordHasher;
            _unitOfWork = unitOfWork;
            _mailService = mailService;
        }


        public async Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request)
        {
            // Check if email already exists
            var existingEmail = await _userrepository.CheckExistEmailAsync(request.Email);
            if (existingEmail != null)
            {
                throw new ArgumentException("Email hoặc Username đã tồn tại trong hệ thống");
            }

            // Check if username already exists
            var existingUsername = await _userrepository.CheckExistUsernameAsync(request.Username);
            if (existingUsername != null)
            {
                throw new ArgumentException("Email hoặc Username đã tồn tại trong hệ thống");
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Fullname = request.Fullname,
                Phone = request.Phone,
                RoleId = request.RoleId,
                Status = UserStatus.Pending.ToString(),
                CreatedAt = DateTime.UtcNow,
                isActiveMail = false,
                ManagerId = null
            };

            //save using repository
            await _userrepository.CreateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();
            await SendEmailVerificationAsync(request.Email, request.Password);

            //get role name since "user.Role.Name" doesnt work
            var roleRepository = _unitOfWork.RoleRepository;
            var role = await roleRepository.GetRoleByIdAsync(user.RoleId);

            return new CreateUserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                Role = role.Name ?? "unknown"
            };

        }
        public async Task<UpdateUserResponse> UpdateUserAsync(UpdateUserRequest request, int id)
        {
            var user = await _userrepository.GetUserByIdAsync(id);
            if (user == null)
            {
                throw new NotFoundException("Không tìm thấy người dùng");
            }

            //update user properties
            user.Fullname = request.Fullname;
            user.Phone = request.Phone;

            await _userrepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return new UpdateUserResponse
            {
                Username = user.Username,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                Role = user.Role.Name,
                ManagerId = user.ManagerId
            };

        }
        public async Task<PagedResultDto<GetAllUsersResponse>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? roleId = null, bool? isActiveEmail = null, bool? isUnassignedManager = null)
        {
            if (page < 1)
                throw new BadRequestException("Page must be greater than 0.");
            if (pageSize < 1 || pageSize > 100)
                throw new BadRequestException("PageSize must be between 1 and 100.");

            var (users, totalCount) = await _userrepository.GetPaginatedAsync(page, pageSize, isActive, search, roleId, isActiveEmail, isUnassignedManager);
            
            var data = users.Select(user => new GetAllUsersResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                Role = user.Role.Name,
                Status = user.Status ?? "Unknown",
                CreatedAt = user.CreatedAt,
                isActiveEmail = user.isActiveMail,
                ManagerId = user.ManagerId
            }).ToList();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResultDto<GetAllUsersResponse>
            {
                Items = data,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalCount,
                TotalPages = totalPages,
                HasNext = page < totalPages,
                HasPrevious = page > 1 && totalCount > 0
            };
        }

        public async Task<GetUserByIdResponse> GetUserByIdAsync(int id)
        {
            var user = await _userrepository.GetUserByIdAsync(id);

            if (user == null)
            {
                throw new NotFoundException("Không tìm thấy người dùng");
            }

            return new GetUserByIdResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                Role = user.Role.Name,
                Status = user.Status ?? "Unknown",
                CreatedAt = user.CreatedAt,
                managerId = user.ManagerId
            };
        }

        public async Task<bool> ReactivateUserAsync(int id)
        {
            var result = await _userrepository.ReactivateUserAsync(id);

            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }

            return result;
        }

        public async Task<bool> SoftDeleteUserAsync(int id)
        {
            var result = await _userrepository.SoftDeleteUserAsync(id);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<User> UpdateUserPasswordAsync(UpdateUserPasswordRequest user, int id)
        {
            var existingUser = await _userrepository.GetUserByIdAsync(id);
            if (existingUser == null)
            {
                throw new NotFoundException("Không tìm thấy người dùng");
            }

            //check current password
            if (!_passwordHasher.VerifyPassword(user.CurrentPassword, existingUser.PasswordHash))
            {
                throw new BadRequestException("Mật khẩu hiện tại không đúng");
            }

            //update password
            existingUser.PasswordHash = _passwordHasher.HashPassword(user.NewPassword);

            await _userrepository.UpdateUserAsync(existingUser);
            await _unitOfWork.SaveChangesAsync();

            return existingUser;

        }

        public async Task<User> UpdateUserForAdminAsync(UpdateUserForAdminRequest request, int id)
        {
            var user = await _userrepository.GetUserByIdAsync(id);
            if (user == null)
            {
                throw new KeyNotFoundException("Không tìm thấy người dùng");
            }

            //update user properties
            user.RoleId = request.RoleId;

            await _userrepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return user;
        }

        public async Task AssignManagerIdAsync(int staffId, int managerId)
        {
            if(staffId == managerId)
            {
                throw new BadRequestException("Người dùng không thể tự quản lý chính mình");
            }

            var staff = await _userrepository.GetUserByIdAsync(staffId);
            if(staff == null)
            {
                throw new NotFoundException("Không tìm thấy Staff");
            }

            var manager = await _userrepository.GetUserByIdAsync(managerId);
            if (manager == null)
            {
                throw new NotFoundException("Không tìm thấy Manager");
            }

            //map Role.name -> registerrole
            if(!Enum.TryParse<RegisterRole>(manager.Role.Name, out var managerRole))
            {
                throw new BadRequestException($"Role '{manager.Role.Name}' cho Manager không tồn tại");
            }

            //the user with the right role that allow to use this func
            var allowRole = new[]
            {
                RegisterRole.Manager,
                RegisterRole.Admin
            };

            if(!allowRole.Contains(managerRole))
            {
                throw new ForbiddenException("User không có quyền assign manager");
            }

            staff.ManagerId = managerId;

            await _userrepository.UpdateUserAsync(staff);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnAssignManagerAsync(int staffId, int requestUserId, string requestUserName)
        {
            var staff = await _userrepository.GetUserByIdAsync(staffId);
            if (staff == null)
            {
                throw new NotFoundException("Không tìm thấy Staff");
            }

            if (staff.ManagerId == null)
            {
                throw new InvalidOperationException("Staff này hiện đang không được manager nào quản lý");
            }

            if (!Enum.TryParse<RegisterRole>(requestUserName, out var requestRole))
            {
                throw new BadRequestException($"Role '{requestUserName}' không tồn tại.");
            }

            var isAdmin = requestRole == RegisterRole.Admin;
            var isManager = requestRole == RegisterRole.Manager;

            if (!isAdmin && !isManager)
            {
                throw new ForbiddenException("User không có quyền unassign");
            }

            if (isManager && staff.ManagerId != requestUserId)
            {
                throw new ForbiddenException("Manager ID không khớp");
            }

            staff.ManagerId = null;

            await _userrepository.UpdateUserAsync(staff);
            await _unitOfWork.SaveChangesAsync();

        }



        //misc
        private async Task SendEmailVerificationAsync(string email, string? password = null)
        {
            var user = await _userrepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new NotFoundException("Không tìm thấy email trong hệ thống");

            if (user.isActiveMail == true)
                throw new BadRequestException("Email đã được xác thực trước đó");

            string otp = GenerateOtp(); // You need to add this method
            var utcNow = DateTime.UtcNow;
            var token = new EmailVerificationToken
            {
                UserId = user.Id,
                OtpCode = otp,
                CreatedAt = utcNow,
                ExpirationTime = utcNow.AddMinutes(5),
            };

            await _unitOfWork.EmailVerificationRepository.CreateTokenAsync(token);
            await _unitOfWork.SaveChangesAsync();

            await _mailService.SendEmailVerificationMailAsync(email, otp, password);
        }
        private string GenerateOtp()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            int code = BitConverter.ToInt32(bytes, 0);
            return Math.Abs(code % 1000000).ToString("D6");
        }
        public async Task<List<User>> GetEmployeesByManagerIdAsync(int userId)
        {
            var manager = await _userrepository.GetUserByIdAsync(userId);

            if (manager.ManagerId != null)
            {
                throw new UnauthorizedAccessException("Bạn không phải là manager nên không có quyền xem danh sách nhân viên");
            }

            var employees = await _unitOfWork.UserRepository.GetEmployeesByManagerIdAsync(userId);
            if (employees == null || !employees.Any())
                throw new KeyNotFoundException($"Manager {userId} không có nhân viên nào");

            return employees;
        }




    }
}
