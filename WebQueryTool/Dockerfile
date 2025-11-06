# Stage 1: Build .NET application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY WebQueryTool.sln ./
COPY WebQueryTool.Domain/*.csproj ./WebQueryTool.Domain/
COPY WebQueryTool.Application/*.csproj ./WebQueryTool.Application/
COPY WebQueryTool.Infrastructure/*.csproj ./WebQueryTool.Infrastructure/
COPY WebQueryTool.API/*.csproj ./WebQueryTool.API/

# Restore dependencies
RUN dotnet restore WebQueryTool.sln

# Copy all source code
COPY . .

# Build
WORKDIR /src/WebQueryTool.API
RUN dotnet build "WebQueryTool.API.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "WebQueryTool.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published files
COPY --from=publish /app/publish .

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Run application
ENTRYPOINT ["dotnet", "WebQueryTool.API.dll"]
