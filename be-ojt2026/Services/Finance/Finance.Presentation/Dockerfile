FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8086

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Services/Finance/Finance.Presentation/Finance.Presentation.csproj", "Services/Finance/Finance.Presentation/"]
COPY ["Services/Finance/Finance.Infrastructure/Finance.Infrastructure.csproj", "Services/Finance/Finance.Infrastructure/"]
COPY ["Services/Finance/Finance.Application/Finance.Application.csproj", "Services/Finance/Finance.Application/"]
COPY ["Services/Finance/Finance.Domain/Finance.Domain.csproj", "Services/Finance/Finance.Domain/"]
COPY ["BuildingBlocks/BuildingBlocks.csproj", "BuildingBlocks/"]
RUN dotnet restore "Services/Finance/Finance.Presentation/Finance.Presentation.csproj"
COPY . .
WORKDIR "/src/Services/Finance/Finance.Presentation"
RUN dotnet build "Finance.Presentation.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Finance.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Finance.Presentation.dll"]
