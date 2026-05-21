using Authentication.Application.DTOs.User;
using Authentication.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.IRepositories
{
    public interface IUserRepository
    {
        //querry
        Task<(IEnumerable<User> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? roleId = null, bool? isActiveEmail = null, bool? isUnassignedManager = null);
        Task<User?> GetUserByIdAsync(int id);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> CheckExistEmailAsync(string email);
        Task<User?> CheckExistUsernameAsync(string username);
        Task<User?> CheckIfEmailRealAsync(bool email);

        //crud
        Task<User> CreateUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<bool> SoftDeleteUserAsync(int id);
        Task<bool> ReactivateUserAsync(int id);


        Task<List<User>> GetEmployeesByManagerIdAsync(int managerId);

    }
}
