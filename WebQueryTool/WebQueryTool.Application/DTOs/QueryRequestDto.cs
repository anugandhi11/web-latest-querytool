using System;

namespace WebQueryTool.Application.DTOs
{
    /// <summary>
    /// Query Request DTO
    /// CRITICAL: Contains Base64-encoded SQL for Imperva WAF bypass
    /// </summary>
    public class QueryRequestDto
    {
        /// <summary>
        /// Base64-encoded SQL query
        /// This prevents WAF from detecting SQL keywords in HTTP request body
        /// </summary>
        public string QueryEncoded { get; set; } = string.Empty;

        /// <summary>
        /// Database connection identifier
        /// </summary>
        public string ConnectionId { get; set; } = string.Empty;

        /// <summary>
        /// Query execution options
        /// </summary>
        public QueryExecutionOptionsDto ExecutionOptions { get; set; } = new();
    }

    public class QueryExecutionOptionsDto
    {
        /// <summary>
        /// Maximum number of rows to return
        /// </summary>
        public int MaxRows { get; set; } = 1000;

        /// <summary>
        /// Query timeout in seconds
        /// </summary>
        public int Timeout { get; set; } = 30;
    }

    /// <summary>
    /// Query Result DTO
    /// </summary>
    public class QueryResultDto
    {
        /// <summary>
        /// Query result rows (dynamic objects)
        /// </summary>
        public List<dynamic> Rows { get; set; } = new();

        /// <summary>
        /// Total number of rows returned
        /// </summary>
        public int TotalRows { get; set; }

        /// <summary>
        /// Execution time in milliseconds
        /// </summary>
        public long ExecutionTimeMs { get; set; }

        /// <summary>
        /// Query execution timestamp (UTC)
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// Optional: Column metadata
        /// </summary>
        public List<ColumnMetadataDto>? Columns { get; set; }
    }

    public class ColumnMetadataDto
    {
        public string Name { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public bool Nullable { get; set; }
    }

    /// <summary>
    /// Query Error DTO
    /// </summary>
    public class QueryErrorDto
    {
        public string Error { get; set; } = string.Empty;
        public string? Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Query Cancellation Request
    /// </summary>
    public class CancelQueryRequestDto
    {
        public string QueryId { get; set; } = string.Empty;
    }
}
