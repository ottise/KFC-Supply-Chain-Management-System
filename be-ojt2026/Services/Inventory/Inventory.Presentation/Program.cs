using BuildingBlocks.Security;
using BuildingBlocks.Web;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Inventory.Presentation.Extensions;
using BuildingBlocks.Web.Middlewares;
using FluentValidation;
using FluentValidation.AspNetCore;
using Inventory.Application.DTOs;
using Inventory.Application.Validations.Product;
using AspNetCoreRateLimit;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductDtoValidator>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithBearer();
builder.Services.AddJwtAuthenticationFromEnv(config);
builder.Configuration.AddUserSecrets<Program>();



// database, third party 
builder.Services.AddInfrastructureServices(config);

// repositories, services, unit of work
builder.Services.AddApplicationServices();

// swagger, json
builder.Services.AddSwaggerAndAuth(config);

//presentation
builder.Services.AddPresentationServices();



builder.Services.AddCorsFromConfig(builder.Configuration);
builder.Services.AddHealthChecks();
builder.Services.AddRateLimiting(builder.Configuration);


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
app.UseMiddleware<IpRateLimitMiddleware>();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
