FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
RUN apk add --no-cache icu-libs tzdata
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
WORKDIR /app
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY ["Services/Authentication/Authentication.Presentation/Authentication.Presentation.csproj", "Services/Authentication/Authentication.Presentation/"]
COPY ["Services/Authentication/Authentication.Infrastructure/Authentication.Infrastructure.csproj", "Services/Authentication/Authentication.Infrastructure/"]
COPY ["Services/Authentication/Authentication.Application/Authentication.Application.csproj", "Services/Authentication/Authentication.Application/"]
COPY ["Services/Authentication/Authentication.Domain/Authentication.Domain.csproj", "Services/Authentication/Authentication.Domain/"]
COPY ["BuildingBlocks/BuildingBlocks.csproj", "BuildingBlocks/"]
RUN dotnet restore "Services/Authentication/Authentication.Presentation/Authentication.Presentation.csproj"
COPY . .
WORKDIR "/src/Services/Authentication/Authentication.Presentation"
RUN dotnet build "Authentication.Presentation.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Authentication.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Authentication.Presentation.dll"]
