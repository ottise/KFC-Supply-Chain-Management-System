using Inventory.Application.DTOs;
using Inventory.Application.DTOs.Supplier;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class SupplierService : ISupplierService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SupplierService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }


        public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierRequest request)
        {
            var errors = new List<string>();

            // Check for existing suppliers with same details
            var existingSupplier = await _unitOfWork.Supplier.CheckExistSupplierAsync(request.Phone, request.Email, request.Name);

            if (existingSupplier != null)
            {
                // Check specific duplicates
                if (!string.IsNullOrEmpty(request.Phone) && existingSupplier.Phone == request.Phone)
                    errors.Add("Sđt đã tồn tại trong hệ thống");

                if (!string.IsNullOrEmpty(request.Email) && existingSupplier.Email == request.Email)
                    errors.Add("Email đã tồn tại trong hệ thống");

                if (!string.IsNullOrEmpty(request.Name) && existingSupplier.Name == request.Name)
                    errors.Add("tên này đã tồn tại trong hệ thống");
            }

            if (errors.Count > 0)
                throw new InvalidOperationException(string.Join("; ", errors));

            var supplier = new Supplier
            {
                Name = request.Name,
                ContactPerson = request.ContactPerson,
                Phone = request.Phone,
                Email = request.Email,
                Address = request.Address,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Supplier.CreateSupplierAsync(supplier);
            await _unitOfWork.SaveChangesAsync();

            return new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address
            };

        }

        public async Task<SupplierDto> UpdateSupplierAsync(UpdateSupplierRequest request, int id)
        {
            var supplier = await _unitOfWork.Supplier.GetSupplierByIdAsync(id) ?? throw new KeyNotFoundException($"Không tìm thấy Supplier này.");

            var errors = new List<string>();

            // Check for existing suppliers with same details
            var existingSupplier = await _unitOfWork.Supplier.CheckExistSupplierAsync(request.Phone, request.Email, request.Name);

            if (existingSupplier != null)
            {
                // Check specific duplicates
                if (!string.IsNullOrEmpty(request.Phone) && existingSupplier.Phone == request.Phone)
                    errors.Add("Sđt đã tồn tại trong hệ thống");

                if (!string.IsNullOrEmpty(request.Email) && existingSupplier.Email == request.Email)
                    errors.Add("Email đã tồn tại trong hệ thống");

                if (!string.IsNullOrEmpty(request.Name) && existingSupplier.Name == request.Name)
                    errors.Add("tên này đã tồn tại trong hệ thống");
            }

            supplier.Name = request.Name;
            supplier.ContactPerson = request.ContactPerson;
            supplier.Email = request.Email;
            supplier.Address = request.Address;

            await _unitOfWork.Supplier.UpdateSupplierAsync(supplier);
            await _unitOfWork.SaveChangesAsync();

            return new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address
            };
        }

        public async Task<bool> SoftDeleteSupplierAsync(int id)
        {
            var supplier = await _unitOfWork.Supplier.SoftDeleteSupplierAsync(id);
            if (supplier == null)
                throw new KeyNotFoundException($"Không tìm thấy Supplier này.");

            await _unitOfWork.SaveChangesAsync();
            return await Task.FromResult(true);
        }

        public async Task<bool> ReactivateSupplierAsync(int id)
        {
            var supplier = await _unitOfWork.Supplier.ReactivateSupplierAsync(id);
            if (supplier == null)
                throw new KeyNotFoundException($"Không tìm thấy Supplier này.");

            await _unitOfWork.SaveChangesAsync();
            return await Task.FromResult(true);
        }

        public async Task<PagedResultDto<SupplierDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null)
        {
            if (page < 1)
                throw new InvalidOperationException("Page must be greater than 0.");
            if (pageSize < 1 || pageSize > 100)
                throw new InvalidOperationException("PageSize must be between 1 and 100.");

            var (suppliers, totalCount) = await _unitOfWork.Supplier.GetPaginatedAsync(page, pageSize, isActive, search);
            
            var data = suppliers.Select(supplier => new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address
            }).ToList();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResultDto<SupplierDto>
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

        public async Task<SupplierDto?> GetSupplierByIdAsync(int id)
        {
            var supplier = await _unitOfWork.Supplier.GetSupplierByIdAsync(id);
            if (supplier == null)
                throw new KeyNotFoundException($"Không tìm thấy Supplier này.");

            return new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address
            };
        }
        public async Task<Supplier?> GetSupplierById(int id)
        {
            if (id <= 0) throw new ArgumentException("Invalid supplier id");
            return await _unitOfWork.Supplier.GetSupplierById(id);
        }
    }

}
