using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace BuildingBlocks.Messaging
{
    public static class MassTransitExtensions
    {
        public static IServiceCollection AddMessaging(this IServiceCollection services, IConfiguration configuration, Assembly? assembly = null)
        {
            services.AddMassTransit(x =>
            {
                x.SetKebabCaseEndpointNameFormatter();

                if (assembly != null)
                {
                    x.AddConsumers(assembly);
                }

                x.UsingRabbitMq((context, cfg) =>
                {
                    var rabbitHost = configuration["RabbitMQ:Host"] ?? "localhost";
                    cfg.Host(rabbitHost, "/", h =>
                    {
                        h.Username(configuration["RabbitMQ:Username"] ?? "guest");
                        h.Password(configuration["RabbitMQ:Password"] ?? "guest");
                    });

                    cfg.ConfigureEndpoints(context);
                });
            });

            return services;
        }
    }
}
