using Inventory.Application.DTOs;
using Inventory.Application.IRepositories;
using Inventory.Application.IServices;
using Inventory.Domain.Entities;
using BuildingBlocks.Exceptions;

namespace Inventory.Application.Services
{
    public class LocationService : ILocationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public LocationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        
        public async Task<LocationDto> CreateAsync(CreateLocationDto dto)
        {
            var name = dto.Name?.Trim();
            var type = dto.Type?.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                throw new BadRequestException("Location name is required.");
            }

            if (name.Length > 255)
            {
                throw new BadRequestException("Location name cannot exceed 255 characters.");
            }

            if (string.IsNullOrWhiteSpace(type))
            {
                throw new BadRequestException("Location type is required.");
            }

            if (type.Length > 255)
            {
                throw new BadRequestException("Location type cannot exceed 255 characters.");
            }

            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(dto.WarehouseId);
            if (warehouse == null)
            {
                throw new NotFoundException($"The warehouse with ID {dto.WarehouseId} was not found.");
            }

            if (warehouse.IsActive != true)
            {
                throw new BadRequestException("Cannot create a location for an inactive warehouse. Please activate the warehouse first.");
            }

            if (dto.ParentId.HasValue)
            {
                var parent = await _unitOfWork.Location.GetByIdAsync(dto.ParentId.Value);
                if (parent == null)
                {
                    throw new NotFoundException($"The parent location with ID {dto.ParentId.Value} was not found.");
                }

                if (parent.IsActive != true)
                {
                    throw new BadRequestException("Cannot use an inactive location as parent. Please activate the parent location first.");
                }

                if (parent.WarehouseId != dto.WarehouseId)
                {
                    throw new BadRequestException("Parent location must belong to the same warehouse.");
                }
            }

            var allLocations = await _unitOfWork.Location.GetByWarehouseIdAsync(dto.WarehouseId);
            var duplicateName = allLocations.Any(l =>
                l.Name != null &&
                l.Name.ToLower() == name.ToLower());
            if (duplicateName)
            {
                throw new ConflictException($"A location with the name '{name}' already exists in this warehouse.");
            }

            var location = new Location
            {
                Name = name,
                Type = type,
                WarehouseId = dto.WarehouseId,
                ParentId = dto.ParentId,
                IsActive = true
            };

            await _unitOfWork.Location.AddRangeAsync(new[] { location });
            await _unitOfWork.SaveChangesAsync();

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                Type = location.Type,
                ParentId = location.ParentId,
                WarehouseId = location.WarehouseId,
                IsActive = location.IsActive ?? true
            };
        }

        public async Task<IEnumerable<LocationDto>> GetAllAsync()
        {
            var locations = await _unitOfWork.Location.GetAllAsync();
            return locations.Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Type = l.Type,
                ParentId = l.ParentId,
                WarehouseId = l.WarehouseId,
                IsActive = l.IsActive ?? false
            });
        }

        public async Task<IEnumerable<LocationDto>> GetByWarehouseIdAsync(int warehouseId)
        {
            var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(warehouseId);
            if (warehouse == null)
            {
                throw new NotFoundException($"The warehouse with ID {warehouseId} was not found.");
            }

            var locations = await _unitOfWork.Location.GetByWarehouseIdAsync(warehouseId);
            return locations.Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Type = l.Type,
                ParentId = l.ParentId,
                WarehouseId = l.WarehouseId,
                IsActive = l.IsActive ?? false
            });
        }

        public async Task<PagedResultDto<LocationDto>> GetPaginatedAsync(int page, int pageSize, int? warehouseId = null, bool? isActive = null, string? search = null, bool? isParent = null, int? parentId = null, int? managerId = null)
        {
            if (page < 1)
                throw new BadRequestException("Page must be greater than 0.");
            if (pageSize < 1 || pageSize > 100)
                throw new BadRequestException("PageSize must be between 1 and 100.");
            if (parentId.HasValue && parentId.Value < 1)
                throw new BadRequestException("ParentId must be greater than 0 when provided.");
            if (managerId.HasValue && managerId.Value < 1)
                throw new BadRequestException("ManagerId must be greater than 0 when provided.");

            if (warehouseId.HasValue)
            {
                var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(warehouseId.Value);
                if (warehouse == null)
                {
                    throw new NotFoundException($"The warehouse with ID {warehouseId.Value} was not found.");
                }
            }

            var (items, totalCount) = await _unitOfWork.Location.GetPaginatedAsync(page, pageSize, warehouseId, isActive, search, isParent, parentId, managerId);
            var data = items.Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Type = l.Type,
                ParentId = l.ParentId,
                WarehouseId = l.WarehouseId,
                IsActive = l.IsActive ?? false
            }).ToList();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResultDto<LocationDto>
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

        public async Task<LocationDto?> GetByIdAsync(int id)
        {
            var location = await _unitOfWork.Location.GetByIdAsync(id);
            if (location == null)
            {
                return null;
            }

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                Type = location.Type,
                ParentId = location.ParentId,
                WarehouseId = location.WarehouseId,
                IsActive = location.IsActive ?? false
            };
        }

        public async Task<LocationDto> UpdateAsync(int id, LocationDto dto)
        {
            var location = await _unitOfWork.Location.GetByIdAsync(id);
            if (location == null)
            {
                throw new NotFoundException($"The location with ID {id} was not found.");
            }

            var newName = dto.Name?.Trim();
            var newType = dto.Type?.Trim();

            if (!string.IsNullOrWhiteSpace(newName) && newName.Length > 255)
            {
                throw new BadRequestException("Location name cannot exceed 255 characters.");
            }

            if (!string.IsNullOrWhiteSpace(newType) && newType.Length > 255)
            {
                throw new BadRequestException("Location type cannot exceed 255 characters.");
            }

            // Validate parent cùng warehouse (nếu có)
            if (dto.ParentId.HasValue)
            {
                var parent = await _unitOfWork.Location.GetByIdAsync(dto.ParentId.Value);
                if (parent == null)
                {
                    throw new NotFoundException($"The parent location with ID {dto.ParentId.Value} was not found.");
                }

                if (parent.WarehouseId != location.WarehouseId)
                {
                    throw new BadRequestException("Parent location must belong to the same warehouse.");
                }

                // Chống tạo vòng (cycle) trong cây location
                var currentParentId = dto.ParentId;
                while (currentParentId.HasValue)
                {
                    if (currentParentId.Value == id)
                    {
                        throw new BadRequestException("Invalid hierarchy: a location cannot be its own ancestor.");
                    }

                    var currentParent = await _unitOfWork.Location.GetByIdAsync(currentParentId.Value);
                    if (currentParent == null || currentParent.ParentId == null)
                    {
                        break;
                    }

                    currentParentId = currentParent.ParentId;
                }

                location.ParentId = dto.ParentId;
            }

            if (!string.IsNullOrWhiteSpace(newName))
            {
                // Chỉ check trùng khi thực sự đổi name
                if (!string.Equals(newName, location.Name, StringComparison.OrdinalIgnoreCase))
                {
                    var allLocations = await _unitOfWork.Location.GetAllAsync();
                    var duplicate = allLocations.Any(l =>
                        l.Id != id &&
                        l.WarehouseId == location.WarehouseId &&
                        l.Name != null &&
                        l.Name.ToLower() == newName.ToLower());

                    if (duplicate)
                    {
                        throw new ConflictException(
                            $"A location with the name '{newName}' already exists in this warehouse.");
                    }
                }

                location.Name = newName;
            }

            if (!string.IsNullOrWhiteSpace(newType))
            {
                location.Type = newType;
            }

            if (dto.IsActive == true && location.IsActive != true)
            {
                if (location.WarehouseId.HasValue)
                {
                    var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(location.WarehouseId.Value);
                    if (warehouse != null && warehouse.IsActive != true)
                    {
                        throw new BadRequestException("Cannot activate this location because its warehouse is inactive. Please activate the warehouse first.");
                    }
                }
            }

            location.IsActive = dto.IsActive;

            await _unitOfWork.Location.UpdateAsync(location);
            await _unitOfWork.SaveChangesAsync();

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                Type = location.Type,
                ParentId = location.ParentId,
                WarehouseId = location.WarehouseId,
                IsActive = location.IsActive ?? false
            };
        }

        public async Task DeactivateAsync(int id)
        {
            var location = await _unitOfWork.Location.GetByIdAsync(id);
            if (location == null)
            {
                throw new NotFoundException($"The location with ID {id} was not found.");
            }

            await _unitOfWork.Location.SetActiveStatusAsync(location, false);
            await _unitOfWork.SaveChangesAsync();
        }


        public async Task ActivateAsync(int id)
        {
            var location = await _unitOfWork.Location.GetByIdAsync(id);
            if (location == null)
            {
                throw new NotFoundException($"The location with ID {id} was not found.");
            }

            if (location.WarehouseId.HasValue)
            {
                var warehouse = await _unitOfWork.Warehouse.GetByIdAsync(location.WarehouseId.Value);
                if (warehouse == null)
                {
                    throw new NotFoundException(
                        $"The warehouse with ID {location.WarehouseId.Value} for this location was not found.");
                }

                if (warehouse.IsActive != true)
                {
                    throw new BadRequestException(
                        "Cannot activate this location because its warehouse is inactive. Please activate the warehouse first.");
                }
            }

            await _unitOfWork.Location.SetActiveStatusAsync(location, true);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var location = await _unitOfWork.Location.GetByIdAsync(id);
            if (location == null)
            {
                throw new NotFoundException($"The location with ID {id} was not found.");
            }

            // Yêu cầu phải deactivate trước khi xóa để tránh nhầm lẫn
            if (location.IsActive == true)
            {
                throw new BadRequestException("Cannot delete an active location. Please deactivate it first.");
            }

            // Không cho xóa nếu còn location con
            var allLocations = await _unitOfWork.Location.GetAllAsync();
            var hasChildren = allLocations.Any(l => l.ParentId == id);
            if (hasChildren)
            {
                throw new BadRequestException("Cannot delete this location because it still has child locations. Please delete or reassign its child locations first.");
            }

            await _unitOfWork.Location.DeleteAsync(location);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<List<Location>> GetLocationByWarehouseIdAsync(int warehouseId)
        {
            if (warehouseId <= 0)
                throw new ArgumentException("Mã kho phải lớn hơn 0");
            var warehouse = await _unitOfWork.Location.GetLocationByWarehouseIdAsync(warehouseId);

            if (warehouse == null || !warehouse.Any())
                throw new KeyNotFoundException($"Không tìm thấy vị trí nào thuộc kho có mã {warehouseId}");

            return warehouse;
        }
    }
}
