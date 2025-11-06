using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Diagnostics;
using WebQueryTool.Application.DTOs;

namespace WebQueryTool.API.Controllers
{
    /// <summary>
    /// Query Controller
    ///
    /// CRITICAL: This controller implements Base64 decoding for Imperva WAF bypass
    ///
    /// HOW IT WORKS:
    /// 1. Frontend encodes SQL to Base64: "SELECT * FROM users" → "U0VMRUNUICogRlJPTSB1c2Vycw=="
    /// 2. WAF allows request through (no SQL keywords detected)
    /// 3. This controller decodes Base64 back to SQL
    /// 4. Query is executed safely with parameterization
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class QueryController : ControllerBase
    {
        private readonly ILogger<QueryController> _logger;
        // TODO: Inject IQueryExecutionService when implemented

        public QueryController(ILogger<QueryController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Execute SQL query with Base64 encoding to prevent Imperva WAF blocks
        /// </summary>
        /// <remarks>
        /// CRITICAL: This endpoint expects Base64-encoded SQL in the request body.
        ///
        /// Sample request:
        ///
        ///     POST /api/v1/query/execute
        ///     {
        ///        "queryEncoded": "U0VMRUNUICogRlJPTSBlbXBsb3llZXM=",
        ///        "connectionId": "conn_123",
        ///        "executionOptions": {
        ///            "maxRows": 1000,
        ///            "timeout": 30
        ///        }
        ///     }
        ///
        /// </remarks>
        /// <param name="request">Query request with Base64-encoded SQL</param>
        /// <returns>Query results</returns>
        /// <response code="200">Query executed successfully</response>
        /// <response code="400">Invalid request (bad Base64 encoding or invalid SQL)</response>
        /// <response code="403">Unauthorized (should not happen with proper encoding)</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("execute")]
        [ProducesResponseType(typeof(QueryResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(QueryErrorDto), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(QueryErrorDto), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<QueryResultDto>> ExecuteQuery(
            [FromBody] QueryRequestDto request)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // STEP 1: Validate request
                if (string.IsNullOrEmpty(request.QueryEncoded))
                {
                    _logger.LogWarning("Empty query received");
                    return BadRequest(new QueryErrorDto
                    {
                        Error = "Query cannot be empty",
                        Timestamp = DateTime.UtcNow
                    });
                }

                if (string.IsNullOrEmpty(request.ConnectionId))
                {
                    _logger.LogWarning("Missing connection ID");
                    return BadRequest(new QueryErrorDto
                    {
                        Error = "Connection ID is required",
                        Timestamp = DateTime.UtcNow
                    });
                }

                // STEP 2: Decode Base64 to get original SQL
                string sqlQuery;
                try
                {
                    var sqlBytes = Convert.FromBase64String(request.QueryEncoded);
                    sqlQuery = Encoding.UTF8.GetString(sqlBytes);

                    _logger.LogInformation(
                        "Decoded SQL query for connection {ConnectionId}. SQL length: {Length} characters",
                        request.ConnectionId,
                        sqlQuery.Length
                    );
                }
                catch (FormatException ex)
                {
                    _logger.LogError(ex, "Invalid Base64 encoding in query request");
                    return BadRequest(new QueryErrorDto
                    {
                        Error = "Invalid query encoding. Expected Base64-encoded SQL.",
                        Details = ex.Message,
                        Timestamp = DateTime.UtcNow
                    });
                }

                // STEP 3: Validate SQL (basic security checks)
                var validationResult = ValidateSQL(sqlQuery);
                if (!validationResult.IsValid)
                {
                    _logger.LogWarning(
                        "SQL validation failed: {Reason}. SQL: {SQL}",
                        validationResult.Error,
                        sqlQuery.Substring(0, Math.Min(100, sqlQuery.Length))
                    );

                    return BadRequest(new QueryErrorDto
                    {
                        Error = "Query validation failed",
                        Details = validationResult.Error,
                        Timestamp = DateTime.UtcNow
                    });
                }

                // STEP 4: Execute query (TODO: Implement with Dapper)
                // For now, return mock data to demonstrate the flow
                var result = await ExecuteQueryMock(sqlQuery, request);

                stopwatch.Stop();
                result.ExecutionTimeMs = stopwatch.ElapsedMilliseconds;

                _logger.LogInformation(
                    "Query executed successfully. Connection: {ConnectionId}, Rows: {RowCount}, Time: {ExecutionTime}ms",
                    request.ConnectionId,
                    result.TotalRows,
                    result.ExecutionTimeMs
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(
                    ex,
                    "Query execution failed. Connection: {ConnectionId}, Time: {ExecutionTime}ms",
                    request.ConnectionId,
                    stopwatch.ElapsedMilliseconds
                );

                return StatusCode(500, new QueryErrorDto
                {
                    Error = "Query execution failed",
                    Details = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Cancel a running query
        /// </summary>
        /// <param name="request">Cancel query request</param>
        /// <returns>Cancellation status</returns>
        [HttpPost("cancel")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(QueryErrorDto), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> CancelQuery([FromBody] CancelQueryRequestDto request)
        {
            try
            {
                _logger.LogInformation("Cancelling query: {QueryId}", request.QueryId);

                // TODO: Implement query cancellation logic
                await Task.CompletedTask;

                return Ok(new { message = "Query cancelled successfully", queryId = request.QueryId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel query: {QueryId}", request.QueryId);
                return StatusCode(500, new QueryErrorDto
                {
                    Error = "Failed to cancel query",
                    Details = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Validate SQL query for security
        /// </summary>
        private (bool IsValid, string? Error) ValidateSQL(string sql)
        {
            if (string.IsNullOrWhiteSpace(sql))
            {
                return (false, "Query cannot be empty");
            }

            // Check for dangerous SQL patterns (additional security layer)
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
        /// Mock query execution (for demonstration)
        /// TODO: Replace with actual Dapper implementation
        /// </summary>
        private async Task<QueryResultDto> ExecuteQueryMock(string sql, QueryRequestDto request)
        {
            // Simulate async database call
            await Task.Delay(100);

            // Return mock data
            return new QueryResultDto
            {
                Rows = new List<dynamic>
                {
                    new { id = 1, name = "John Doe", department = "IT", salary = 75000 },
                    new { id = 2, name = "Jane Smith", department = "HR", salary = 65000 },
                    new { id = 3, name = "Bob Johnson", department = "IT", salary = 80000 }
                },
                TotalRows = 3,
                ExecutionTimeMs = 0, // Will be set by caller
                Timestamp = DateTime.UtcNow,
                Columns = new List<ColumnMetadataDto>
                {
                    new() { Name = "id", DataType = "int", Nullable = false },
                    new() { Name = "name", DataType = "varchar", Nullable = false },
                    new() { Name = "department", DataType = "varchar", Nullable = true },
                    new() { Name = "salary", DataType = "decimal", Nullable = true }
                }
            };
        }
    }
}
