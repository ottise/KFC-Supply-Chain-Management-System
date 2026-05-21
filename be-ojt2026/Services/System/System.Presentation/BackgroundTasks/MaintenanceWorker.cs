using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Application.IServices;
using System.Application.DTOs.Maintenance;
using System.Domain.Enums;
using System.Domain.Common;
using System.Linq;

namespace System.Presentation.BackgroundTasks
{
    public class MaintenanceWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MaintenanceWorker> _logger;

        public MaintenanceWorker(IServiceProvider serviceProvider, ILogger<MaintenanceWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MaintenanceWorker is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var maintenanceService = scope.ServiceProvider.GetRequiredService<IMaintenanceService>();
                        var now = VietnamDateTime.Now;

                        // 1. Scheduled -> Ongoing (khi đến giờ bắt đầu)
                        var (items, _) = await maintenanceService.GetPagedMaintenanceAsync(1, 100, null);

                        var ticketsToActivate = items.Where(m =>
                            m.status == nameof(MaintenanceStatus.Scheduled) &&
                            now >= m.startTime &&
                            now <= m.endTime).ToList();

                        foreach (var ticket in ticketsToActivate)
                        {
                            var updateRequest = new UpdateMaintenanceRequest
                            {
                                reason = ticket.reason,
                                startTime = ticket.startTime,
                                endTime = ticket.endTime,
                                status = MaintenanceStatus.Ongoing
                            };
                            await maintenanceService.UpdateTicketAsync(ticket.id, updateRequest);
                            _logger.LogInformation("Activated maintenance window {TicketId}", ticket.id);
                        }

                        // 2. Ongoing -> Done (khi hết giờ kết thúc)
                        var ticketsToComplete = items.Where(m =>
                            m.status == nameof(MaintenanceStatus.Ongoing) &&
                            now > m.endTime).ToList();

                        foreach (var ticket in ticketsToComplete)
                        {
                            var updateRequest = new UpdateMaintenanceRequest
                            {
                                reason = ticket.reason,
                                startTime = ticket.startTime,
                                endTime = ticket.endTime,
                                status = MaintenanceStatus.Done
                            };
                            await maintenanceService.UpdateTicketAsync(ticket.id, updateRequest);
                            _logger.LogInformation("Completed maintenance window {TicketId}", ticket.id);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing maintenance status transitions.");
                }

                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }

            _logger.LogInformation("MaintenanceWorker is stopping.");
        }
    }
}