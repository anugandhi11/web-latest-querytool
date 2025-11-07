using System;
using System.Collections.Generic;

namespace WebQueryTool.Application.DTOs
{
    /// <summary>
    /// Schema Metadata DTO - matches frontend TypeScript interface
    /// </summary>
    public class SchemaMetadataDto
    {
        /// <summary>
        /// Connection ID that this schema belongs to
        /// </summary>
        public string ConnectionId { get; set; } = string.Empty;

        /// <summary>
        /// List of databases
        /// </summary>
        public List<DatabaseInfoDto> Databases { get; set; } = new();
    }

    /// <summary>
    /// Database Information DTO
    /// </summary>
    public class DatabaseInfoDto
    {
        /// <summary>
        /// Database name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// List of schemas in this database
        /// </summary>
        public List<SchemaInfoDto> Schemas { get; set; } = new();
    }

    /// <summary>
    /// Schema Information DTO
    /// </summary>
    public class SchemaInfoDto
    {
        /// <summary>
        /// Schema name (e.g., "public", "dbo", "analytics")
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Tables in this schema
        /// </summary>
        public List<TableInfoDto> Tables { get; set; } = new();

        /// <summary>
        /// Views in this schema
        /// </summary>
        public List<ViewInfoDto> Views { get; set; } = new();
    }

    /// <summary>
    /// Table Information DTO
    /// </summary>
    public class TableInfoDto
    {
        /// <summary>
        /// Table name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Schema name
        /// </summary>
        public string Schema { get; set; } = string.Empty;

        /// <summary>
        /// Approximate row count (optional)
        /// </summary>
        public long? RowCount { get; set; }

        /// <summary>
        /// Column information
        /// </summary>
        public List<ColumnInfoDto> Columns { get; set; } = new();
    }

    /// <summary>
    /// View Information DTO
    /// </summary>
    public class ViewInfoDto
    {
        /// <summary>
        /// View name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Schema name
        /// </summary>
        public string Schema { get; set; } = string.Empty;

        /// <summary>
        /// View definition (SQL)
        /// </summary>
        public string? Definition { get; set; }
    }

    /// <summary>
    /// Column Information DTO
    /// </summary>
    public class ColumnInfoDto
    {
        /// <summary>
        /// Column name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Data type (e.g., "varchar", "int", "timestamp")
        /// </summary>
        public string DataType { get; set; } = string.Empty;

        /// <summary>
        /// Is nullable
        /// </summary>
        public bool Nullable { get; set; }

        /// <summary>
        /// Is primary key
        /// </summary>
        public bool? IsPrimaryKey { get; set; }

        /// <summary>
        /// Is foreign key
        /// </summary>
        public bool? IsForeignKey { get; set; }

        /// <summary>
        /// Max length (for string types)
        /// </summary>
        public int? MaxLength { get; set; }

        /// <summary>
        /// Default value
        /// </summary>
        public string? DefaultValue { get; set; }
    }
}
