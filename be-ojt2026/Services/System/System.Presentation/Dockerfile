FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
RUN apk add --no-cache icu-libs tzdata
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
WORKDIR /app
EXPOSE 8082

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY ["Services/System/System.Presentation/System.Presentation.csproj", "Services/System/System.Presentation/"]
COPY ["Services/System/System.Infrastructure/System.Infrastructure.csproj", "Services/System/System.Infrastructure/"]
COPY ["Services/System/System.Application/System.Application.csproj", "Services/System/System.Application/"]
COPY ["Services/System/System.Domain/System.Domain.csproj", "Services/System/System.Domain/"]
COPY ["BuildingBlocks/BuildingBlocks.csproj", "BuildingBlocks/"]
RUN dotnet restore "Services/System/System.Presentation/System.Presentation.csproj"
COPY . .
WORKDIR "/src/Services/System/System.Presentation"
RUN dotnet build "System.Presentation.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "System.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "System.Presentation.dll"]
