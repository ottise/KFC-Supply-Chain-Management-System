using Authentication.Application.IRepositories;
using Authentication.Domain.Entities;
using Authentication.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Authentication.Infrastructure.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly AuthenticationDbContext _context;
        public RoleRepository(AuthenticationDbContext context)
        {
            _context = context;
        }

        //get all roles
        public async Task<List<Role>> GetAllRolesAsync()
        {
            return await _context.Roles.ToListAsync();
        }

        //get role by id
        public async Task<Role> GetRoleByIdAsync(int id)
        {
            return await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
        }

        //create role
        public async Task<Role> CreateRoleAsync(Role role)
        {
            await _context.Roles.AddAsync(role);
            return role;
        }

        //update role
        public async Task<Role> UpdateRoleAsync(Role role)
        {
            _context.Roles.Update(role);
            return await Task.FromResult(role);
        }

        //delete role (hard)
        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return false;
            _context.Roles.Remove(role);
            return true;
        }

        public async Task<Role?> GetRoleByNameAsync(string name)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == name);
        }
    }
}
