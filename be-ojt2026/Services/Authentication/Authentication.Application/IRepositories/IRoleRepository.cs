using Authentication.Domain.Entities;

namespace Authentication.Application.IRepositories
{
    public interface IRoleRepository
    {
        Task<List<Role>> GetAllRolesAsync();
        Task<Role> GetRoleByIdAsync(int id);
        Task<Role> CreateRoleAsync(Role role);
        Task<Role> UpdateRoleAsync(Role role);
        Task<bool> DeleteRoleAsync(int id);
        Task<Role?> GetRoleByNameAsync(string name);
    }
}
