using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Domain.Entities;
using System.Domain.Enums;
using System.Domain.Common;
using System.Application.IServices;
using System.Application.DTOs.Maintenance;
using System.Application.IRepositories;

namespace System.Application.Services
{
    public class MaintenanceService : IMaintenanceService
    {
        private readonly IUnitOfWork _unitOfWork;

        public MaintenanceService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<MaintenanceResponse?> GetActiveMaintenanceAsync()
        {
            var entity = await _unitOfWork.MaintenanceRepository.GetActiveMaintenanceAsync();
            return entity == null ? null : MapToResponse(entity);
        }

        public async Task<IEnumerable<MaintenanceResponse>> GetUpcomingMaintenanceAsync(int limit = 5)
        {
            var allTickets = await _unitOfWork.MaintenanceRepository.GetAllAsync();
            var upcoming = allTickets
                .Where(t => t.Status == MaintenanceStatus.Scheduled && t.StartTime > VietnamDateTime.Now)
                .OrderBy(t => t.StartTime)
                .Take(limit)
                .Select(MapToResponse)
                .ToList();
            return upcoming;
        }

        public async Task<(IEnumerable<MaintenanceResponse> Items, int TotalCount)> GetPagedMaintenanceAsync(
            int page, int pageSize, string? keyword, MaintenanceStatus? status = null)
        {
            var data = await _unitOfWork.MaintenanceRepository.GetAllAsync();

            var query = data.AsEnumerable();

            if (status.HasValue)
            {
                query = query.Where(m => m.Status == status.Value);
            }

            if (!string.IsNullOrEmpty(keyword))
            {
                query = query.Where(m => m.Reason.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            }

            var totalCount = query.Count();
            var items = query.Skip((page - 1) * pageSize).Take(pageSize)
                             .Select(MapToResponse)
                             .ToList();

            return (items, totalCount);
        }

        public async Task<MaintenanceResponse?> GetByIdAsync(string id)
        {
            var entity = await _unitOfWork.MaintenanceRepository.GetByIdAsync(id);
            return entity == null ? null : MapToResponse(entity);
        }

        public async Task<MaintenanceResponse> CreateTicketAsync(CreateMaintenanceRequest request, string createdBy)
        {
            if (string.IsNullOrWhiteSpace(request.reason))
            {
                throw new InvalidOperationException("Reason cannot be null, empty, or whitespace.");
            }

            if (request.startTime >= request.endTime)
            {
                throw new InvalidOperationException("StartTime must be earlier than EndTime.");
            }

            if (request.startTime <= VietnamDateTime.Now)
            {
                throw new InvalidOperationException("StartTime must be in the future.");
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var lastId = await _unitOfWork.MaintenanceRepository.GetLastTicketIdAsync();
                int nextIdNum = 1;
                if (!string.IsNullOrEmpty(lastId) && lastId.StartsWith("TICK-"))
                {
                    if (int.TryParse(lastId.Substring(5), out int lastIdNum))
                    {
                        nextIdNum = lastIdNum + 1;
                    }
                }

                var maintenance = new SystemMaintenance
                {
                    Id = $"TICK-{nextIdNum:D5}",
                    Reason = request.reason,
                    StartTime = request.startTime,
                    EndTime = request.endTime,
                    Status = MaintenanceStatus.Scheduled,
                    CreatedAt = VietnamDateTime.Now,
                    CreatedBy = createdBy
                };

                var allTickets = await _unitOfWork.MaintenanceRepository.GetAllAsync();
                var activeTickets = allTickets.Where(t =>
                    t.Status == MaintenanceStatus.Scheduled ||
                    t.Status == MaintenanceStatus.Ongoing).ToList();

                var overlapping = activeTickets.Any(m =>
                    (maintenance.StartTime >= m.StartTime && maintenance.StartTime <= m.EndTime) ||
                    (maintenance.EndTime >= m.StartTime && maintenance.EndTime <= m.EndTime) ||
                    (m.StartTime >= maintenance.StartTime && m.StartTime <= maintenance.EndTime));

                if (overlapping)
                {
                    throw new InvalidOperationException("This maintenance ticket overlaps with an existing scheduled or ongoing maintenance window.");
                }

                await _unitOfWork.MaintenanceRepository.AddAsync(maintenance);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
                return MapToResponse(maintenance);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<bool> UpdateTicketAsync(string id, UpdateMaintenanceRequest request)
        {
            var existing = await _unitOfWork.MaintenanceRepository.GetByIdAsync(id);
            if (existing == null) return false;

            // Chỉ cho phép update khi status là Scheduled hoặc Ongoing
            if (existing.Status != MaintenanceStatus.Scheduled && existing.Status != MaintenanceStatus.Ongoing)
            {
                throw new InvalidOperationException("Only Scheduled or Ongoing tickets can be updated.");
            }

            // Không cho phép đổi status từ Done/Cancelled sang Ongoing
            if ((existing.Status == MaintenanceStatus.Done || existing.Status == MaintenanceStatus.Cancelled)
                && request.status == MaintenanceStatus.Ongoing)
            {
                throw new InvalidOperationException("Cannot change status to Ongoing from Done or Cancelled.");
            }

            existing.Reason = request.reason;
            existing.StartTime = request.startTime;
            existing.EndTime = request.endTime;
            existing.Status = request.status;

            // Re-validate overlaps (loại trừ chính nó và các ticket đã Done/Cancelled)
            var allTickets = await _unitOfWork.MaintenanceRepository.GetAllAsync();
            var activeTickets = allTickets.Where(t =>
                t.Id != id &&
                (t.Status == MaintenanceStatus.Scheduled || t.Status == MaintenanceStatus.Ongoing)).ToList();

            var overlapping = activeTickets.Any(m =>
                (existing.StartTime >= m.StartTime && existing.StartTime <= m.EndTime) ||
                (existing.EndTime >= m.StartTime && existing.EndTime <= m.EndTime) ||
                (m.StartTime >= existing.StartTime && m.StartTime <= existing.EndTime));

            if (overlapping)
            {
                throw new InvalidOperationException("Updating this ticket would cause an overlap with another maintenance window.");
            }

            await _unitOfWork.MaintenanceRepository.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTicketAsync(string id)
        {
            var existing = await _unitOfWork.MaintenanceRepository.GetByIdAsync(id);
            if (existing == null) return false;

            // Không cho phép xóa ticket đã Done
            if (existing.Status == MaintenanceStatus.Done)
            {
                throw new InvalidOperationException("Cannot cancel a completed maintenance ticket.");
            }

            existing.Status = MaintenanceStatus.Cancelled;
            await _unitOfWork.MaintenanceRepository.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<MaintenanceResponse> StopMaintenanceAsync()
        {
            var allTickets = await _unitOfWork.MaintenanceRepository.GetAllAsync();
            var activeMaintenance = allTickets.FirstOrDefault(t => t.Status == MaintenanceStatus.Ongoing);

            if (activeMaintenance == null)
            {
                throw new InvalidOperationException("No ongoing maintenance found.");
            }

            activeMaintenance.Status = MaintenanceStatus.Done;
            activeMaintenance.EndTime = VietnamDateTime.Now;
            await _unitOfWork.MaintenanceRepository.UpdateAsync(activeMaintenance);
            await _unitOfWork.SaveChangesAsync();
            return MapToResponse(activeMaintenance);
        }

        private MaintenanceResponse MapToResponse(SystemMaintenance maintenance)
        {
            return new MaintenanceResponse
            {
                id = maintenance.Id,
                reason = maintenance.Reason,
                startTime = maintenance.StartTime,
                endTime = maintenance.EndTime,
                status = maintenance.Status.ToString(),
                createdAt = maintenance.CreatedAt,
                createdBy = maintenance.CreatedBy
            };
        }
    }
}