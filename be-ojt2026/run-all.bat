@echo off
title Launching Microservices Supply Chain

echo Starting services in background...

start /B dotnet watch run --project .\Services\Authentication\Authentication.Presentation\Authentication.Presentation.csproj
timeout /t 2 > nul

start /B dotnet watch run --project .\Services\Inventory\Inventory.Presentation\Inventory.Presentation.csproj
timeout /t 2 > nul

start /B dotnet watch run --project .\GatewayAPI\GatewayAPI.csproj
timeout /t 2 > nul

start /B dotnet watch run --project .\Services\System\System.Presentation\System.Presentation.csproj

echo All services started.
pause