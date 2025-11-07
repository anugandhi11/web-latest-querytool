using Microsoft.AspNetCore.Mvc;
using System.Data;
using Npgsql;
using Dapper;
using WebQueryTool.Application.DTOs;

namespace WebQueryTool.API.Controllers
{
    /// <summary>
    /// Schema Controller
    ///
    /// Provides database schema metadata for AWS Redshift and PostgreSQL
    /// Powers the schema browser tree navigation on the frontend
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class SchemaController : ControllerBase
    {
        private readonly ILogger<SchemaController> _logger;
        private readonly IConfiguration _configuration;

        // TODO: Inject connection factory when implemented
        public SchemaController(
            ILogger<SchemaController> _logger,
            IConfiguration configuration)
        {
            this._logger = _logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Get schema metadata for a database connection
        /// </summary>
        /// <param name="connectionId">Connection identifier</param>
        /// <returns>Complete schema metadata (databases, schemas, tables, columns)</returns>
        /// <response code="200">Schema metadata retrieved successfully</response>
        /// <response code="404">Connection not found</response>
        /// <response code="500">Failed to retrieve schema metadata</response>
        [HttpGet("{connectionId}")]
        [ProducesResponseType(typeof(SchemaMetadataDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(QueryErrorDto), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(QueryErrorDto), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<SchemaMetadataDto>> GetSchemaMetadata(string connectionId)
        {
            try
            {
                _logger.LogInformation("Fetching schema metadata for connection: {ConnectionId}", connectionId);

                // Get connection string (for now, use default PostgreSQL from appsettings)
                var connectionString = GetConnectionString(connectionId);
                if (string.IsNullOrEmpty(connectionString))
                {
                    return NotFound(new QueryErrorDto
                    {
                        Error = $"Connection '{connectionId}' not found",
                        Timestamp = DateTime.UtcNow
                    });
                }

                // Fetch schema metadata
                var metadata = await FetchSchemaMetadataFromDatabase(connectionId, connectionString);

                _logger.LogInformation(
                    "Schema metadata fetched successfully. Connection: {ConnectionId}, Databases: {DbCount}",
                    connectionId,
                    metadata.Databases.Count
                );

                return Ok(metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to fetch schema metadata for connection: {ConnectionId}",
                    connectionId
                );

                return StatusCode(500, new QueryErrorDto
                {
                    Error = "Failed to retrieve schema metadata",
                    Details = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Fetch schema metadata from PostgreSQL/Redshift database
        /// </summary>
        private async Task<SchemaMetadataDto> FetchSchemaMetadataFromDatabase(
            string connectionId,
            string connectionString)
        {
            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            var metadata = new SchemaMetadataDto
            {
                ConnectionId = connectionId,
                Databases = new List<DatabaseInfoDto>()
            };

            // Get current database name
            var currentDatabase = connection.Database;

            var databaseInfo = new DatabaseInfoDto
            {
                Name = currentDatabase,
                Schemas = new List<SchemaInfoDto>()
            };

            // Get all schemas (excluding system schemas)
            var schemas = await connection.QueryAsync<string>(@"
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
                ORDER BY schema_name;
            ");

            foreach (var schemaName in schemas)
            {
                var schemaInfo = new SchemaInfoDto
                {
                    Name = schemaName,
                    Tables = new List<TableInfoDto>(),
                    Views = new List<ViewInfoDto>()
                };

                // Get tables in this schema
                var tables = await connection.QueryAsync<(string TableName, long? RowCount)>(@"
                    SELECT
                        t.table_name,
                        pg_class.reltuples::bigint as row_count
                    FROM information_schema.tables t
                    LEFT JOIN pg_catalog.pg_class ON pg_class.relname = t.table_name
                    LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                        AND pg_namespace.nspname = t.table_schema
                    WHERE t.table_schema = @SchemaName
                        AND t.table_type = 'BASE TABLE'
                    ORDER BY t.table_name;
                ", new { SchemaName = schemaName });

                foreach (var (tableName, rowCount) in tables)
                {
                    // Get columns for this table
                    var columns = await GetTableColumns(connection, schemaName, tableName);

                    schemaInfo.Tables.Add(new TableInfoDto
                    {
                        Name = tableName,
                        Schema = schemaName,
                        RowCount = rowCount > 0 ? rowCount : null,
                        Columns = columns
                    });
                }

                // Get views in this schema
                var views = await connection.QueryAsync<string>(@"
                    SELECT table_name
                    FROM information_schema.views
                    WHERE table_schema = @SchemaName
                    ORDER BY table_name;
                ", new { SchemaName = schemaName });

                foreach (var viewName in views)
                {
                    schemaInfo.Views.Add(new ViewInfoDto
                    {
                        Name = viewName,
                        Schema = schemaName
                    });
                }

                databaseInfo.Schemas.Add(schemaInfo);
            }

            metadata.Databases.Add(databaseInfo);
            return metadata;
        }

        /// <summary>
        /// Get columns for a specific table
        /// </summary>
        private async Task<List<ColumnInfoDto>> GetTableColumns(
            IDbConnection connection,
            string schemaName,
            string tableName)
        {
            var columns = await connection.QueryAsync<ColumnInfoDto>(@"
                SELECT
                    c.column_name as Name,
                    c.data_type as DataType,
                    CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END as Nullable,
                    c.character_maximum_length as MaxLength,
                    c.column_default as DefaultValue,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                                ON tc.constraint_name = kcu.constraint_name
                                AND tc.table_schema = kcu.table_schema
                            WHERE tc.constraint_type = 'PRIMARY KEY'
                                AND tc.table_schema = @SchemaName
                                AND tc.table_name = @TableName
                                AND kcu.column_name = c.column_name
                        ) THEN true
                        ELSE false
                    END as IsPrimaryKey,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                                ON tc.constraint_name = kcu.constraint_name
                                AND tc.table_schema = kcu.table_schema
                            WHERE tc.constraint_type = 'FOREIGN KEY'
                                AND tc.table_schema = @SchemaName
                                AND tc.table_name = @TableName
                                AND kcu.column_name = c.column_name
                        ) THEN true
                        ELSE false
                    END as IsForeignKey
                FROM information_schema.columns c
                WHERE c.table_schema = @SchemaName
                    AND c.table_name = @TableName
                ORDER BY c.ordinal_position;
            ", new { SchemaName = schemaName, TableName = tableName });

            return columns.ToList();
        }

        /// <summary>
        /// Get connection string for a connection ID
        /// TODO: Replace with actual connection service lookup
        /// </summary>
        private string? GetConnectionString(string connectionId)
        {
            // For now, return default PostgreSQL connection from appsettings
            // In production, look up the connection details from database/service
            return _configuration.GetConnectionString("DefaultConnection");
        }
    }
}
