FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
RUN apk add --no-cache icu-libs tzdata
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
WORKDIR /app
EXPOSE 8085

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY ["Services/Inventory/Inventory.Presentation/Inventory.Presentation.csproj", "Services/Inventory/Inventory.Presentation/"]
COPY ["Services/Inventory/Inventory.Infrastructure/Inventory.Infrastructure.csproj", "Services/Inventory/Inventory.Infrastructure/"]
COPY ["Services/Inventory/Inventory.Application/Inventory.Application.csproj", "Services/Inventory/Inventory.Application/"]
COPY ["Services/Inventory/Inventory.Domain/Inventory.Domain.csproj", "Services/Inventory/Inventory.Domain/"]
COPY ["BuildingBlocks/BuildingBlocks.csproj", "BuildingBlocks/"]
RUN dotnet restore "Services/Inventory/Inventory.Presentation/Inventory.Presentation.csproj"
COPY . .
WORKDIR "/src/Services/Inventory/Inventory.Presentation"
RUN dotnet build "Inventory.Presentation.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Inventory.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Inventory.Presentation.dll"]
