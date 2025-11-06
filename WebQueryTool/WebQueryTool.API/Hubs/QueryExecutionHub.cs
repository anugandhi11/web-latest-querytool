using Microsoft.AspNetCore.SignalR;
using System.Text;

namespace WebQueryTool.API.Hubs
{
    /// <summary>
    /// SignalR Hub for Real-time Query Execution
    ///
    /// Features:
    /// - Real-time query progress updates
    /// - Query cancellation support
    /// - Connection management
    /// - Error handling with detailed messages
    /// </summary>
    public class QueryExecutionHub : Hub
    {
        private readonly ILogger<QueryExecutionHub> _logger;
        // TODO: Inject IQueryExecutionService when implemented

        public QueryExecutionHub(ILogger<QueryExecutionHub> _logger)
        {
            this._logger = _logger;
        }

        /// <summary>
        /// Execute query with real-time progress updates
        /// </summary>
        /// <param name="queryEncoded">Base64-encoded SQL query</param>
        /// <param name="connectionId">Database connection ID</param>
        /// <param name="maxRows">Maximum rows to return</param>
        /// <param name="timeout">Query timeout in seconds</param>
        public async Task ExecuteQueryWithProgress(
            string queryEncoded,
            string connectionId,
            int maxRows = 1000,
            int timeout = 30)
        {
            var clientId = Context.ConnectionId;
            var username = Context.User?.Identity?.Name ?? "Anonymous";

            _logger.LogInformation(
                "User {Username} executing query via SignalR. ConnectionId: {ConnectionId}",
                username, clientId);

            try
            {
                // Send initial status
                await Clients.Caller.SendAsync("QueryStatus", new
                {
                    status = "Connecting",
                    message = "Connecting to database...",
                    timestamp = DateTime.UtcNow
                });

                // Decode Base64 SQL
                string sql;
                try
                {
                    var sqlBytes = Convert.FromBase64String(queryEncoded);
                    sql = Encoding.UTF8.GetString(sqlBytes);

                    _logger.LogInformation(
                        "Decoded SQL query. Length: {Length} characters",
                        sql.Length);
                }
                catch (FormatException ex)
                {
                    _logger.LogError(ex, "Invalid Base64 encoding");
                    await Clients.Caller.SendAsync("QueryError", new
                    {
                        error = "Invalid query encoding",
                        details = ex.Message,
                        timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // Validate SQL
                var validationResult = ValidateSQL(sql);
                if (!validationResult.IsValid)
                {
                    _logger.LogWarning("SQL validation failed: {Error}", validationResult.Error);
                    await Clients.Caller.SendAsync("QueryError", new
                    {
                        error = "Query validation failed",
                        details = validationResult.Error,
                        timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // Send executing status
                await Clients.Caller.SendAsync("QueryStatus", new
                {
                    status = "Executing",
                    message = "Executing query...",
                    timestamp = DateTime.UtcNow
                });

                // Simulate query execution with progress updates
                // TODO: Replace with actual database execution
                await SimulateQueryExecution(sql, connectionId, maxRows);

                _logger.LogInformation(
                    "Query executed successfully via SignalR. Connection: {ConnectionId}",
                    connectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Query execution failed via SignalR");
                await Clients.Caller.SendAsync("QueryError", new
                {
                    error = "Query execution failed",
                    details = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Cancel a running query
        /// </summary>
        /// <param name="queryId">Query execution identifier</param>
        public async Task CancelQuery(string queryId)
        {
            var username = Context.User?.Identity?.Name ?? "Anonymous";

            _logger.LogInformation(
                "User {Username} cancelling query: {QueryId}",
                username, queryId);

            try
            {
                // TODO: Implement actual query cancellation logic
                await Task.CompletedTask;

                await Clients.Caller.SendAsync("QueryCancelled", new
                {
                    queryId,
                    message = "Query cancelled successfully",
                    timestamp = DateTime.UtcNow
                });

                _logger.LogInformation("Query cancelled: {QueryId}", queryId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel query: {QueryId}", queryId);
                await Clients.Caller.SendAsync("QueryError", new
                {
                    error = "Failed to cancel query",
                    details = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Connection established event
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var username = Context.User?.Identity?.Name ?? "Anonymous";
            var connectionId = Context.ConnectionId;

            _logger.LogInformation(
                "User {Username} connected via SignalR. ConnectionId: {ConnectionId}",
                username, connectionId);

            // Add user to their personal group (for targeted messages)
            if (!string.IsNullOrEmpty(username))
            {
                await Groups.AddToGroupAsync(connectionId, username);
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Connection disconnected event
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var username = Context.User?.Identity?.Name ?? "Anonymous";
            var connectionId = Context.ConnectionId;

            _logger.LogInformation(
                "User {Username} disconnected from SignalR. ConnectionId: {ConnectionId}",
                username, connectionId);

            // TODO: Cancel any running queries for this connection
            // await _queryService.CancelQueriesForConnection(connectionId);

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Validate SQL query
        /// </summary>
        private (bool IsValid, string? Error) ValidateSQL(string sql)
        {
            if (string.IsNullOrWhiteSpace(sql))
            {
                return (false, "Query cannot be empty");
            }

            // Check for dangerous SQL patterns
            var dangerousPatterns = new[]
            {
                ("DROP TABLE", "DROP TABLE statements are not allowed"),
                ("DROP DATABASE", "DROP DATABASE statements are not allowed"),
                ("TRUNCATE TABLE", "TRUNCATE TABLE statements are not allowed"),
                ("xp_cmdshell", "System commands are not allowed"),
                ("EXEC(", "Dynamic SQL execution is not allowed"),
                ("EXECUTE(", "Dynamic SQL execution is not allowed")
            };

            foreach (var (pattern, message) in dangerousPatterns)
            {
                if (sql.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                {
                    return (false, message);
                }
            }

            return (true, null);
        }

        /// <summary>
        /// Simulate query execution with progress updates
        /// TODO: Replace with actual Dapper query execution
        /// </summary>
        private async Task SimulateQueryExecution(string sql, string connectionId, int maxRows)
        {
            var startTime = DateTime.UtcNow;

            // Progress update 1: 25%
            await Task.Delay(500);
            await Clients.Caller.SendAsync("QueryProgress", new
            {
                percentage = 25,
                rowsProcessed = 0,
                message = "Fetching data...",
                timestamp = DateTime.UtcNow
            });

            // Progress update 2: 50%
            await Task.Delay(500);
            await Clients.Caller.SendAsync("QueryProgress", new
            {
                percentage = 50,
                rowsProcessed = 0,
                message = "Processing results...",
                timestamp = DateTime.UtcNow
            });

            // Progress update 3: 75%
            await Task.Delay(500);
            await Clients.Caller.SendAsync("QueryProgress", new
            {
                percentage = 75,
                rowsProcessed = 3,
                message = "Preparing output...",
                timestamp = DateTime.UtcNow
            });

            // Final result
            await Task.Delay(500);
            var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            var result = new
            {
                rows = new[]
                {
                    new { id = 1, name = "John Doe", department = "IT", salary = 75000, hired_date = "2020-01-15" },
                    new { id = 2, name = "Jane Smith", department = "HR", salary = 65000, hired_date = "2019-03-22" },
                    new { id = 3, name = "Bob Johnson", department = "IT", salary = 80000, hired_date = "2021-07-10" }
                },
                totalRows = 3,
                executionTimeMs = (long)executionTime,
                timestamp = DateTime.UtcNow,
                columns = new[]
                {
                    new { name = "id", dataType = "int", nullable = false },
                    new { name = "name", dataType = "varchar", nullable = false },
                    new { name = "department", dataType = "varchar", nullable = true },
                    new { name = "salary", dataType = "decimal", nullable = true },
                    new { name = "hired_date", dataType = "date", nullable = true }
                }
            };

            await Clients.Caller.SendAsync("QueryComplete", result);
        }
    }
}
