FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8083

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Services/Purchase/Purchase.Presentation/Purchase.Presentation.csproj", "Services/Purchase/Purchase.Presentation/"]
COPY ["Services/Purchase/Purchase.Infrastructure/Purchase.Infrastructure.csproj", "Services/Purchase/Purchase.Infrastructure/"]
COPY ["Services/Purchase/Purchase.Application/Purchase.Application.csproj", "Services/Purchase/Purchase.Application/"]
COPY ["Services/Purchase/Purchase.Domain/Purchase.Domain.csproj", "Services/Purchase/Purchase.Domain/"]
COPY ["BuildingBlocks/BuildingBlocks.csproj", "BuildingBlocks/"]
RUN dotnet restore "Services/Purchase/Purchase.Presentation/Purchase.Presentation.csproj"
COPY . .
WORKDIR "/src/Services/Purchase/Purchase.Presentation"
RUN dotnet build "Purchase.Presentation.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Purchase.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Purchase.Presentation.dll"]
