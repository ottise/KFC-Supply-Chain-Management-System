using Authentication.Application.DTOs.User;
using Authentication.Application.DTOs.Common;
using Authentication.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IServices
{
    public interface IUserService
    {
        Task<PagedResultDto<GetAllUsersResponse>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? roleId = null, bool? isActiveEmail = null, bool? isUnassignedManager = null);
        Task<GetUserByIdResponse> GetUserByIdAsync(int id);
        Task<CreateUserResponse> CreateUserAsync(CreateUserRequest user);
        Task<UpdateUserResponse> UpdateUserAsync(UpdateUserRequest user, int id);
        Task<bool> SoftDeleteUserAsync(int id);
        Task<bool> ReactivateUserAsync(int id);
        Task<User> UpdateUserPasswordAsync(UpdateUserPasswordRequest user, int id);
        Task<User> UpdateUserForAdminAsync(UpdateUserForAdminRequest user, int id);
        Task AssignManagerIdAsync(int staffId, int managerId);
        Task UnAssignManagerAsync(int staffId, int requestUserId, string requestUserName);
        Task<List<User>> GetEmployeesByManagerIdAsync(int userId);

    }
}
