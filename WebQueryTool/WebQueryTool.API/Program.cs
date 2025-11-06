using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure SignalR for real-time communication
builder.Services.AddSignalR(options =>
{
    // Enable detailed errors in development
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();

    // Keep alive interval
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);

    // Client timeout
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);

    // Handshake timeout
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);

    // Maximum message size (1MB)
    options.MaximumReceiveMessageSize = 1024 * 1024;
});

// Configure CORS (CRITICAL: Required for Angular frontend and SignalR)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",  // Angular dev server
                "https://localhost:4200"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();  // Required for SignalR
    });
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Web Query Tool API",
        Version = "v1",
        Description = "Production-ready API for executing database queries with Imperva WAF bypass",
        Contact = new OpenApiContact
        {
            Name = "Verisk Analytics",
            Email = "support@verisk.com"
        }
    });

    // Include XML comments (if available)
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// TODO: Add services
// builder.Services.AddScoped<IQueryExecutionService, QueryExecutionService>();
// builder.Services.AddSingleton<IConnectionManager, ConnectionManager>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web Query Tool API v1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at app root
    });
}

// Use CORS (must be before Authentication/Authorization)
app.UseCors("AllowAngularDev");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Map SignalR Hub
app.MapHub<WebQueryTool.API.Hubs.QueryExecutionHub>("/hubs/query-execution");

// Health check endpoint
app.MapGet("/health", () => new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    signalR = "enabled"
});

app.Run();
