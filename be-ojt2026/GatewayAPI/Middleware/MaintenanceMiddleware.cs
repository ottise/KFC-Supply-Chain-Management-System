using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Text.Json;

namespace GatewayAPI.Middleware
{
    public class MaintenanceMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private const string CacheKey = "MaintenanceStatus";
        private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(5);

        public MaintenanceMiddleware(
            RequestDelegate next,
            IMemoryCache cache,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _next = next;
            _cache = cache;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower() ?? "";

            // 1. Exempt Admin API Routes - Admin users need to access admin endpoints even during maintenance
            if (path.StartsWith("/api/v1/admin/") ||
                path.StartsWith("/api/v1/system/maintenance"))
            {
                await _next(context);
                return;
            }

            // 2. Exempt Auth Routes (login, register, etc.)
            if (path.StartsWith("/api/v1/auth/"))
            {
                await _next(context);
                return;
            }

            // 3. Check if user is Admin (fallback check after path exemption)
            if (context.User.IsInRole("Admin"))
            {
                await _next(context);
                return;
            }

            // 4. Check Maintenance Status (Cached for 5s)
            var cachedResult = await _cache.GetOrCreateAsync(CacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                var result = await FetchMaintenanceStatusAsync();
                return result;
            });

            // 3. If System service is down - fail-open: allow other services to work
            if (cachedResult == null)
            {
                await _next(context);
                return;
            }

            // 4. Only block if maintenance is actually ongoing (Scheduled = future plan, not blocking yet)
            if (cachedResult.status == "Ongoing")
            {
                context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    message = "Hệ thống đang được bảo trì. Vui lòng thử lại sau.",
                    reason = cachedResult.reason,
                    endTime = cachedResult.endTime
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                return;
            }

            await _next(context);
        }

        private async Task<MaintenanceStatusResponse?> FetchMaintenanceStatusAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(3);
                var systemServiceUrl = _configuration["Services:SystemUrl"] ?? "http://localhost:5008";
                var response = await client.GetAsync($"{systemServiceUrl}/api/maintenance/status");

                // 204 NoContent = no active maintenance = allow
                if (response.StatusCode == HttpStatusCode.NoContent)
                {
                    return new MaintenanceStatusResponse { status = "None" };
                }

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<MaintenanceStatusResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return result;
                }
                // Non-success status - fail-open: allow traffic
                return null;
            }
            catch
            {
                // System service down - fail-open: allow other services to work
                return null;
            }
        }
    }

    public class MaintenanceStatusResponse
    {
        public string? id { get; set; }
        public string? reason { get; set; }
        public DateTime? startTime { get; set; }
        public DateTime? endTime { get; set; }
        public string? status { get; set; }
    }
}
