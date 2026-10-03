using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiTransporte.Migrations
{
    /// <inheritdoc />
    public partial class CambiarFechaReporteAString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FechaGeneracion",
                table: "Reporte",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaGeneracion",
                table: "Reporte",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
