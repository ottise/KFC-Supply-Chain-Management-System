using Authentication.Application.DTOs.Roles;
using Authentication.Application.IRepositories;
using Authentication.Application.IServices;
using Authentication.Application.Validations.Roles;
using Authentication.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Authentication.Application.Services
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _roleRepository;
        private readonly IUnitOfWork _unitOfWork;
        public RoleService(
            IRoleRepository roleRepository,
            IUnitOfWork unitOfWork) {
            _roleRepository = roleRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CreateRoleResponse> CreateRoleAsync(CreateRoleRequest role)
        {
            var newRole = new Role
            {
                Name = role.Name
            };

            await _roleRepository.CreateRoleAsync(newRole);
            await _unitOfWork.SaveChangesAsync();

            return new CreateRoleResponse
            {
                Id = newRole.Id,
                Name = newRole.Name
            };
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var result = await _roleRepository.DeleteRoleAsync(id);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<List<Role>> GetAllRolesAsync()
        {
            var result = await _roleRepository.GetAllRolesAsync();
            return result.ToList();
        }

        public async Task<Role> GetRoleByIdAsync(int id)
        {
            var result = await _roleRepository.GetRoleByIdAsync(id);
            if (result == null)
            {
                throw new KeyNotFoundException("Không tìm thấy vai trò");
            }
            return result;
        }

        public async Task<UpdateRoleResponse> UpdateRoleAsync(UpdateRoleRequest role, int id)
        {
            var existingRole = await _roleRepository.GetRoleByIdAsync(id);
            if (existingRole == null)
            {
                throw new KeyNotFoundException("Không tìm thấy vai trò");
            }

            existingRole.Name = role.Name;

            await _roleRepository.UpdateRoleAsync(existingRole);
            await _unitOfWork.SaveChangesAsync();

            return new UpdateRoleResponse
            {
                Id = existingRole.Id,
                Name = existingRole.Name
            };

        }
    }
}
