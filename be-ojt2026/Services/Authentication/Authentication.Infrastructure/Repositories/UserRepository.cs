using Authentication.Application.IRepositories;
using Authentication.Application.DTOs.User;
using Authentication.Application.IServices;
using Authentication.Domain.Entities;
using Authentication.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Authentication.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AuthenticationDbContext _context;
        
        public UserRepository(AuthenticationDbContext context)
        {
            _context = context;
        }

        //get all users include status inactive with pagination
        public async Task<(IEnumerable<User> Items, int TotalCount)> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? roleId = null, bool? isActiveEmail = null, bool? isUnassignedManager = null)
        {
            var query = _context.Users.Include(u => u.Role).AsQueryable();
            
            if (isActive.HasValue)
            {
                query = query.Where(u => u.Status == (isActive.Value ? "Active" : "Inactive"));
            }

            if (isActiveEmail.HasValue)
            {
                query = query.Where(u => u.isActiveMail == isActiveEmail.Value);
            }

            if (roleId.HasValue)
            {
                query = query.Where(u => u.RoleId == roleId.Value);
            }

            if (isUnassignedManager == true)
            {
                query = query.Where(u => u.ManagerId == null);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim().ToLower();
                query = query.Where(u =>
                    (u.Username != null && u.Username.ToLower().Contains(searchTerm)) ||
                    (u.Email != null && u.Email.ToLower().Contains(searchTerm)) ||
                    (u.Fullname != null && u.Fullname.ToLower().Contains(searchTerm)) ||
                    (u.Phone != null && u.Phone.ToLower().Contains(searchTerm)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(u => u.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
                
            return (items, totalCount);
        }
        //get by id
        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users
                .Where(u => u.Id == id)
                .Include(u => u.Role)
                .FirstOrDefaultAsync();
        }
        //create user
        public async Task<User> CreateUserAsync(User request)
        {
            await _context.Users.AddAsync(request);
            return request;
        }
        //update user
        public async Task<User> UpdateUserAsync(User request)
        {
            _context.Users.Update(request);
            return await Task.FromResult(request);
        }
        //sorf delete user
        public async Task<bool> SoftDeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.Status = "Inactive";
            _context.Users.Update(user);
            return true;
        }
        //reactive user
        public async Task<bool> ReactivateUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.Status = "Active";
            _context.Users.Update(user);
            return true;
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .Where(u => u.Username == username)
                .Include(u => u.Role)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Email == email)
                .Include(u => u.Role)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> CheckExistEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Email == email)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> CheckExistUsernameAsync(string username)
        {
            return await _context.Users
                .Where(u => u.Username == username)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> CheckIfEmailRealAsync(bool email)
        {
            return await _context.Users
                .Where(u => u.isActiveMail == true)
                .FirstOrDefaultAsync();
        }


        public async Task<List<User>> GetEmployeesByManagerIdAsync(int managerId)
        {
            return await _context.Users
                .Where(u => u.ManagerId == managerId && u.Status == "Active")
                .ToListAsync();
        }
    
        
    }
}
