FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8086

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Services/Logistics/Logistics.Presentation/Logistics.Presentation.csproj", "Services/Logistics/Logistics.Presentation/"]
COPY ["Services/Logistics/Logistics.Infrastructure/Logistics.Infrastructure.csproj", "Services/Logistics/Logistics.Infrastructure/"]
COPY ["Services/Logistics/Logistics.Application/Logistics.Application.csproj", "Services/Logistics/Logistics.Application/"]
COPY ["Services/Logistics/Logistics.Domain/Logistics.Domain.csproj", "Services/Logistics/Logistics.Domain/"]
COPY ["BuildingBlocks/BuildingBlocks.csproj", "BuildingBlocks/"]
RUN dotnet restore "Services/Logistics/Logistics.Presentation/Logistics.Presentation.csproj"
COPY . .
WORKDIR "/src/Services/Logistics/Logistics.Presentation"
RUN dotnet build "Logistics.Presentation.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Logistics.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Logistics.Presentation.dll"]
