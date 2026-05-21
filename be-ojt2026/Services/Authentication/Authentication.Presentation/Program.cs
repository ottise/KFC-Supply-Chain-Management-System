using Authentication.Infrastructure.Data;
using Authentication.Presentation.Extensions;
using Authentication.Application.DTOs;
using BuildingBlocks.Web;
using BuildingBlocks.Web.Middlewares;
using Microsoft.EntityFrameworkCore;
using AspNetCoreRateLimit;

var builder = WebApplication.CreateBuilder(args);

// --- SERVICES ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithBearer();
builder.Services.AddSwaggerAndAuth(builder.Configuration);
builder.Configuration.AddUserSecrets<Program>();

// Database
builder.Services.AddDbContext<AuthenticationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Mail settings
builder.Services.Configure<MailSetting>(builder.Configuration.GetSection("MailSettings"));

// Shared configuration from BuildingBlocks
builder.Services.AddCorsFromConfig(builder.Configuration);
builder.Services.AddHealthChecks();
builder.Services.AddRateLimiting(builder.Configuration);

// Application services
builder.Services.AddApplicationServices();
var app = builder.Build();

// --- PIPELINE ---
if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Default");
app.UseGlobalExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<IpRateLimitMiddleware>();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
