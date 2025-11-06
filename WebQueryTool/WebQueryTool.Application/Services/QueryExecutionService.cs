using Dapper;
using System.Data;
using System.Diagnostics;
using WebQueryTool.Application.DTOs;
using WebQueryTool.Infrastructure.DatabaseProviders;

namespace WebQueryTool.Application.Services
{
    /// <summary>
    /// Query Execution Service Interface
    /// </summary>
    public interface IQueryExecutionService
    {
        Task<QueryResultDto> ExecuteQueryAsync(
            string sql,
            string connectionString,
            DatabaseType databaseType,
            int maxRows = 1000,
            int timeout = 30);

        Task<bool> CancelQueryAsync(string queryId);
    }

    /// <summary>
    /// Query Execution Service
    /// Uses Dapper for high-performance database access
    /// </summary>
    public class QueryExecutionService : IQueryExecutionService
    {
        private readonly ILogger<QueryExecutionService> _logger;

        public QueryExecutionService(ILogger<QueryExecutionService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Execute SQL query against database
        /// Uses Dapper for high performance (3x faster than EF Core)
        /// </summary>
        public async Task<QueryResultDto> ExecuteQueryAsync(
            string sql,
            string connectionString,
            DatabaseType databaseType,
            int maxRows = 1000,
            int timeout = 30)
        {
            _logger.LogInformation(
                "Executing query against {DatabaseType}. SQL length: {Length}",
                databaseType, sql.Length);

            var stopwatch = Stopwatch.StartNew();

            try
            {
                using var connection = DatabaseConnectionFactory.CreateConnection(
                    databaseType,
                    connectionString);

                await connection.OpenAsync();

                // Execute query with Dapper
                // Dapper is 3x faster than Entity Framework Core for raw SQL
                var results = await connection.QueryAsync<dynamic>(
                    sql,
                    commandTimeout: timeout);

                stopwatch.Stop();

                // Convert to list and limit rows
                var resultsList = results.Take(maxRows).ToList();

                // Extract column metadata
                var columns = ExtractColumnMetadata(resultsList);

                _logger.LogInformation(
                    "Query executed successfully. Rows: {RowCount}, Time: {ExecutionTime}ms",
                    resultsList.Count, stopwatch.ElapsedMilliseconds);

                return new QueryResultDto
                {
                    Rows = resultsList,
                    TotalRows = resultsList.Count,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    Timestamp = DateTime.UtcNow,
                    Columns = columns
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Query execution failed. Time: {ExecutionTime}ms",
                    stopwatch.ElapsedMilliseconds);
                throw;
            }
        }

        /// <summary>
        /// Cancel running query
        /// </summary>
        public async Task<bool> CancelQueryAsync(string queryId)
        {
            _logger.LogInformation("Cancelling query: {QueryId}", queryId);

            // TODO: Implement query cancellation using CancellationToken
            // This requires tracking active queries in a concurrent dictionary
            await Task.CompletedTask;

            return true;
        }

        /// <summary>
        /// Extract column metadata from results
        /// </summary>
        private List<ColumnMetadataDto> ExtractColumnMetadata(List<dynamic> results)
        {
            if (results.Count == 0)
                return new List<ColumnMetadataDto>();

            var firstRow = results.FirstOrDefault() as IDictionary<string, object>;
            if (firstRow == null)
                return new List<ColumnMetadataDto>();

            return firstRow.Keys.Select(key =>
            {
                var value = firstRow[key];
                var dataType = value?.GetType().Name ?? "unknown";

                return new ColumnMetadataDto
                {
                    Name = key,
                    DataType = dataType,
                    Nullable = value == null
                };
            }).ToList();
        }
    }
}
