using System.Data;
using Npgsql;
using MySqlConnector;
using Microsoft.Data.SqlClient;

namespace WebQueryTool.Infrastructure.DatabaseProviders
{
    /// <summary>
    /// Database type enumeration
    /// </summary>
    public enum DatabaseType
    {
        PostgreSQL,
        MySQL,
        SQLServer,
        Redshift
    }

    /// <summary>
    /// Database Connection Factory
    /// Creates database connections based on type and connection string
    /// </summary>
    public class DatabaseConnectionFactory
    {
        /// <summary>
        /// Create database connection
        /// </summary>
        /// <param name="databaseType">Type of database</param>
        /// <param name="connectionString">Connection string</param>
        /// <returns>IDbConnection instance</returns>
        public static IDbConnection CreateConnection(
            DatabaseType databaseType,
            string connectionString)
        {
            return databaseType switch
            {
                DatabaseType.PostgreSQL => new NpgsqlConnection(connectionString),
                DatabaseType.MySQL => new MySqlConnection(connectionString),
                DatabaseType.SQLServer => new SqlConnection(connectionString),
                DatabaseType.Redshift => new NpgsqlConnection(connectionString), // Redshift uses PostgreSQL protocol
                _ => throw new ArgumentException($"Unsupported database type: {databaseType}")
            };
        }

        /// <summary>
        /// Test database connection
        /// </summary>
        /// <param name="databaseType">Type of database</param>
        /// <param name="connectionString">Connection string</param>
        /// <returns>True if connection successful</returns>
        public static async Task<(bool Success, string? Error)> TestConnectionAsync(
            DatabaseType databaseType,
            string connectionString)
        {
            try
            {
                using var connection = CreateConnection(databaseType, connectionString);
                await connection.OpenAsync();
                await connection.CloseAsync();
                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, ex.Message);
            }
        }
    }
}
