using BuildingBlocks.Security;
using BuildingBlocks.Web;
using BuildingBlocks.Web.Middlewares;
using Microsoft.EntityFrameworkCore;
using System.Application.IServices;
using System.Application.Services;
using System.Application.IRepositories;
using System.Infrastructure.Data;
using System.Infrastructure.Repositories;
using System.Presentation.BackgroundTasks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithBearer();
builder.Services.AddJwtAuthenticationFromEnv(builder.Configuration);

// Register Repositories & Services
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddHostedService<MaintenanceWorker>();



builder.Services.AddDbContext<SystemDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCorsFromConfig(builder.Configuration);
builder.Services.AddHealthChecks();

var app = builder.Build();

if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Default");
app.UseGlobalExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
