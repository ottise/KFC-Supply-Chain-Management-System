using BuildingBlocks.Exceptions;
using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;

namespace Inventory.Application.Services
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IUnitOfWork _unitOfWork;

        public WarehouseService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<WarehouseDto>> GetAllAsync()
        {
            var warehouses = await _unitOfWork.Warehouse.GetAllAsync();
            return warehouses.Select(w => new WarehouseDto
            {
                Id = w.Id,
                WarehouseCode = w.WarehouseCode,
                Name = w.Name,
                Address = w.Address,
                Phone = w.Phone,
                Email = w.Email,
                ManagerId = w.ManagerId,
                WarehouseType = w.WarehouseType,
                AreaSqm = w.AreaSqm,
                IsActive = w.IsActive ?? false,
                Notes = w.Notes,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            });
        }

        public async Task<PagedResultDto<WarehouseDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? managerId = null)
        {
            if (page < 1)
                throw new BadRequestException("Page must be greater than 0.");
            if (pageSize < 1 || pageSize > 100)
                throw new BadRequestException("PageSize must be between 1 and 100.");
            if (managerId.HasValue && managerId.Value < 1)
                throw new BadRequestException("ManagerId must be greater than 0 when provided.");

            var (items, totalCount) = await _unitOfWork.Warehouse.GetPaginatedAsync(page, pageSize, isActive, search, managerId);
            var data = items.Select(w => new WarehouseDto
            {
                Id = w.Id,
                WarehouseCode = w.WarehouseCode,
                Name = w.Name,
                Address = w.Address,
                Phone = w.Phone,
                Email = w.Email,
                ManagerId = w.ManagerId,
                WarehouseType = w.WarehouseType,
                AreaSqm = w.AreaSqm,
                IsActive = w.IsActive ?? false,
                Notes = w.Notes,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            }).ToList();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResultDto<WarehouseDto>
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

        public async Task<WarehouseDto?> GetByIdAsync(int id)
        {
            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(id);
            if (warehouse == null)
            {
                return null;
            }

            return new WarehouseDto
            {
                Id = warehouse.Id,
                WarehouseCode = warehouse.WarehouseCode,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Phone = warehouse.Phone,
                Email = warehouse.Email,
                ManagerId = warehouse.ManagerId,
                WarehouseType = warehouse.WarehouseType,
                AreaSqm = warehouse.AreaSqm,
                IsActive = warehouse.IsActive ?? false,
                Notes = warehouse.Notes,
                CreatedAt = warehouse.CreatedAt,
                UpdatedAt = warehouse.UpdatedAt
            };
        }

        public async Task<WarehouseDto> CreateAsync(CreateWarehouseDto dto)
        {
            var code = dto.WarehouseCode?.Trim();
            var name = dto.Name?.Trim();

            if (string.IsNullOrWhiteSpace(code) || code.Length > 15)
            {
                throw new BadRequestException("WarehouseCode cannot be empty and must not exceed 15 characters.");
            }

            if (string.IsNullOrWhiteSpace(name) || name.Length > 255)
            {
                throw new BadRequestException("Warehouse name is required and cannot exceed 255 characters.");
            }

            if (dto.Address != null && dto.Address.Length > 500)
            {
                throw new BadRequestException("Warehouse address cannot exceed 500 characters.");
            }

            if (dto.Phone != null && dto.Phone.Length > 50)
            {
                throw new BadRequestException("Warehouse phone cannot exceed 50 characters.");
            }

            if (dto.Email != null && dto.Email.Length > 255)
            {
                throw new BadRequestException("Warehouse email cannot exceed 255 characters.");
            }

            if (dto.WarehouseType != null && dto.WarehouseType.Length > 100)
            {
                throw new BadRequestException("Warehouse type cannot exceed 100 characters.");
            }

            var allWarehouses = await _unitOfWork.Warehouse.GetAllAsync();
            var nameExists = allWarehouses.Any(w =>
                w.Name != null &&
                name != null &&
                w.Name.ToLower() == name.ToLower());
            if (nameExists)
            {
                throw new ConflictException(
                    $"Conflict: A warehouse with the name '{name}' already exists.");
            }

            var existing = await _unitOfWork.Warehouse.GetByCodeAsync(code);
            if (existing != null)
            {
                throw new ConflictException($"Conflict: A warehouse with the code '{code}' already exists.");
            }

            var warehouse = new Warehouse
            {
                WarehouseCode = code,
                Name = name,
                Address = dto.Address,
                Phone = dto.Phone,
                Email = dto.Email,
                ManagerId = dto.ManagerId,
                WarehouseType = dto.WarehouseType,
                AreaSqm = dto.AreaSqm,
                IsActive = true,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Warehouse.AddAsync(warehouse);
            await _unitOfWork.SaveChangesAsync();

            return new WarehouseDto
            {
                Id = warehouse.Id,
                WarehouseCode = warehouse.WarehouseCode,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Phone = warehouse.Phone,
                Email = warehouse.Email,
                ManagerId = warehouse.ManagerId,
                WarehouseType = warehouse.WarehouseType,
                AreaSqm = warehouse.AreaSqm,
                IsActive = warehouse.IsActive ?? true,
                Notes = warehouse.Notes,
                CreatedAt = warehouse.CreatedAt,
                UpdatedAt = warehouse.UpdatedAt
            };
        }

        public async Task<WarehouseDto> UpdateAsync(int id, CreateWarehouseDto dto)
        {
            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(id);
            if (warehouse == null)
            {
                throw new NotFoundException($"The warehouse with ID {id} was not found.");
            }

            // Cho phép update từng phần: field nào null/empty thì giữ nguyên
            var newCode = dto.WarehouseCode?.Trim();
            var newName = dto.Name?.Trim();

            if (!string.IsNullOrWhiteSpace(newCode))
            {
                if (newCode.Length > 15)
                {
                    throw new BadRequestException("WarehouseCode cannot exceed 15 characters.");
                }

                // Chỉ check trùng khi thực sự đổi code
                if (!string.Equals(newCode, warehouse.WarehouseCode, StringComparison.OrdinalIgnoreCase))
                {
                    var existing = await _unitOfWork.Warehouse.GetByCodeAsync(newCode);
                    if (existing != null && existing.Id != id)
                    {
                        throw new ConflictException($"Conflict: A warehouse with the code '{newCode}' already exists.");
                    }
                }

                warehouse.WarehouseCode = newCode;
            }

            if (!string.IsNullOrWhiteSpace(newName))
            {
                if (newName.Length > 255)
                {
                    throw new BadRequestException("Warehouse name cannot exceed 255 characters.");
                }

                // Chỉ check trùng khi thực sự đổi name
                if (!string.Equals(newName, warehouse.Name, StringComparison.OrdinalIgnoreCase))
                {
                    var allWarehouses = await _unitOfWork.Warehouse.GetAllAsync();
                    var duplicateName = allWarehouses.Any(w =>
                        w.Id != id &&
                        w.Name != null &&
                        w.Name.ToLower() == newName.ToLower());
                    if (duplicateName)
                    {
                        throw new ConflictException(
                            $"Conflict: A warehouse with the name '{newName}' already exists.");
                    }
                }

                warehouse.Name = newName;
            }

            if (dto.Address != null)
            {
                if (dto.Address.Length > 500)
                {
                    throw new BadRequestException("Warehouse address cannot exceed 500 characters.");
                }

                warehouse.Address = dto.Address;
            }

            if (dto.Phone != null)
            {
                if (dto.Phone.Length > 50)
                {
                    throw new BadRequestException("Warehouse phone cannot exceed 50 characters.");
                }

                warehouse.Phone = dto.Phone;
            }

            if (dto.Email != null)
            {
                if (dto.Email.Length > 255)
                {
                    throw new BadRequestException("Warehouse email cannot exceed 255 characters.");
                }

                warehouse.Email = dto.Email;
            }

            if (dto.WarehouseType != null)
            {
                if (dto.WarehouseType.Length > 100)
                {
                    throw new BadRequestException("Warehouse type cannot exceed 100 characters.");
                }

                warehouse.WarehouseType = dto.WarehouseType;
            }

            if (dto.AreaSqm.HasValue)
            {
                warehouse.AreaSqm = dto.AreaSqm;
            }

            if (dto.Notes != null)
            {
                warehouse.Notes = dto.Notes;
            }

            if (dto.IsActive.HasValue)
            {
                if (dto.IsActive.Value == false)
                {
                    var locations = await _unitOfWork.Location.GetAllAsync();
                    var hasActiveLocation = locations.Any(l => l.WarehouseId == id && l.IsActive == true);
                    if (hasActiveLocation)
                    {
                        throw new BadRequestException("Cannot deactivate this warehouse because it still has active locations. Please deactivate all locations of this warehouse first.");
                    }
                }
                warehouse.IsActive = dto.IsActive.Value;
            }

            warehouse.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Warehouse.UpdateAsync(warehouse);
            await _unitOfWork.SaveChangesAsync();

            return new WarehouseDto
            {
                Id = warehouse.Id,
                WarehouseCode = warehouse.WarehouseCode,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Phone = warehouse.Phone,
                Email = warehouse.Email,
                ManagerId = warehouse.ManagerId,
                WarehouseType = warehouse.WarehouseType,
                AreaSqm = warehouse.AreaSqm,
                IsActive = warehouse.IsActive ?? false,
                Notes = warehouse.Notes,
                CreatedAt = warehouse.CreatedAt,
                UpdatedAt = warehouse.UpdatedAt
            };
        }

        public async Task DeactivateAsync(int id)
        {
            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(id);
            if (warehouse == null)
            {
                throw new NotFoundException($"The warehouse with ID {id} was not found.");
            }

            var locations = await _unitOfWork.Location.GetAllAsync();
            var hasActiveLocation = locations.Any(l => l.WarehouseId == id && l.IsActive == true);
            if (hasActiveLocation)
            {
                throw new BadRequestException("Cannot deactivate this warehouse because it still has active locations. Please deactivate all locations of this warehouse first.");
            }

            await _unitOfWork.Warehouse.SetActiveStatusAsync(warehouse, false);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task ActivateAsync(int id)
        {
            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(id);
            if (warehouse == null)
            {
                throw new NotFoundException($"The warehouse with ID {id} was not found.");
            }

            await _unitOfWork.Warehouse.SetActiveStatusAsync(warehouse, true);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(id);
            if (warehouse == null)
            {
                throw new NotFoundException($"The warehouse with ID {id} was not found.");
            }

            // Bắt buộc kho phải đã được deactivate trước khi xóa
            if (warehouse.IsActive == true)
            {
                throw new BadRequestException("Cannot hard delete an active warehouse. Please deactivate it first.");
            }

            // Không cho xóa nếu vẫn còn location (kể cả inactive)
            var locations = await _unitOfWork.Location.GetAllAsync();
            var anyLocation = locations.Any(l => l.WarehouseId == id);
            if (anyLocation)
            {
                throw new BadRequestException("Cannot delete this warehouse because it still has locations. Please delete all locations of this warehouse first.");
            }

            await _unitOfWork.Warehouse.DeleteAsync(warehouse);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<Warehouse?> GetWarehouseByManagerIdAsync(int managerId)
        {
            if (managerId <= 0)
                throw new ArgumentException("Mã quản lý phải lớn hơn 0");

            var warehouse = await _unitOfWork.Warehouse.GetWarehouseByManagerIdAsync(managerId);

            if (warehouse == null)
                throw new KeyNotFoundException($"Không tìm thấy kho nào với mã quản lý {managerId}");

            return warehouse;
        }
        public async Task<List<Warehouse>> GetWarehousesByManagerIdAsync(int managerId)
        {
            if (managerId <= 0)
                throw new ArgumentException("ManagerId không hợp lệ");

            var warehouses = await _unitOfWork.Warehouse.GetWarehousesByManagerIdAsync(managerId);
            if (warehouses == null || !warehouses.Any())
                throw new KeyNotFoundException($"Manager {managerId} không quản lý kho nào");

            return warehouses;
        }

        public async Task<Warehouse> GetWarehouseByLocationIdAsync(int locationId)
        {          

            var warehouse = await _unitOfWork.Warehouse.GetWarehouseByLocationIdAsync(locationId);
            if (warehouse == null)
                throw new KeyNotFoundException($"Không tìm thấy Warehouse cho Location {locationId}");

            return warehouse;
        }
    }
}
