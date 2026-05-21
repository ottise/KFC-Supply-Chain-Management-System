using Authentication.Application.DTOs.Roles;
using Authentication.Domain.Entities;
namespace Authentication.Application.IServices
{
    public interface IRoleService
    {
        Task<List<Role>> GetAllRolesAsync();
        Task<Role> GetRoleByIdAsync(int id);
        Task<CreateRoleResponse> CreateRoleAsync(CreateRoleRequest role);
        Task<UpdateRoleResponse> UpdateRoleAsync(UpdateRoleRequest role, int id);
        Task<bool> DeleteRoleAsync(int id);
    }
}
