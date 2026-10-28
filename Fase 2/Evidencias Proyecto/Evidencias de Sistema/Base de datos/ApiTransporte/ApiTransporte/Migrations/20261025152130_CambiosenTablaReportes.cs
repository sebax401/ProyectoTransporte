using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiTransporte.Migrations
{
    /// <inheritdoc />
    public partial class CambiosenTablaReportes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Empleados",
                columns: table => new
                {
                    IdEmpleado = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", nullable: false),
                    Apellido = table.Column<string>(type: "TEXT", nullable: false),
                    Rut = table.Column<string>(type: "TEXT", nullable: false),
                    Cargo = table.Column<string>(type: "TEXT", nullable: false),
                    TipoContrato = table.Column<string>(type: "TEXT", nullable: false),
                    Estado = table.Column<string>(type: "TEXT", nullable: false),
                    FechaIngreso = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaTermino = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RazonDespido = table.Column<string>(type: "TEXT", nullable: true),
                    Observaciones = table.Column<string>(type: "TEXT", nullable: true),
                    FotoUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empleados", x => x.IdEmpleado);
                });

            migrationBuilder.CreateTable(
                name: "Vehiculo",
                columns: table => new
                {
                    IdVehiculo = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Patente = table.Column<string>(type: "TEXT", nullable: false),
                    Marca = table.Column<string>(type: "TEXT", nullable: true),
                    Modelo = table.Column<string>(type: "TEXT", nullable: false),
                    Anio = table.Column<int>(type: "INTEGER", nullable: false),
                    ProximoKilometraje = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaUltimaMantencion = table.Column<string>(type: "TEXT", nullable: true),
                    FechaProximaMantencion = table.Column<string>(type: "TEXT", nullable: true),
                    FechaRevisionTecnica = table.Column<string>(type: "TEXT", nullable: true),
                    EstadoDpf = table.Column<string>(type: "TEXT", nullable: true),
                    EstadoRevision = table.Column<string>(type: "TEXT", nullable: true),
                    EstadoExtintor = table.Column<string>(type: "TEXT", nullable: true),
                    Observacion = table.Column<string>(type: "TEXT", nullable: true),
                    IdConductor = table.Column<int>(type: "INTEGER", nullable: true),
                    Estado = table.Column<bool>(type: "INTEGER", nullable: false),
                    FotoUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehiculo", x => x.IdVehiculo);
                });

            migrationBuilder.CreateTable(
                name: "Reporte",
                columns: table => new
                {
                    IdReporte = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TipoReporte = table.Column<string>(type: "TEXT", nullable: false),
                    SubTipoReporte = table.Column<string>(type: "TEXT", nullable: false),
                    FechaGeneracion = table.Column<string>(type: "TEXT", nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", nullable: true),
                    NombreRepuesto = table.Column<string>(type: "TEXT", nullable: true),
                    IdVehiculo = table.Column<int>(type: "INTEGER", nullable: false),
                    ValorRepuesto = table.Column<decimal>(type: "TEXT", nullable: true),
                    LugarCompra = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reporte", x => x.IdReporte);
                    table.ForeignKey(
                        name: "FK_Reporte_Vehiculo_IdVehiculo",
                        column: x => x.IdVehiculo,
                        principalTable: "Vehiculo",
                        principalColumn: "IdVehiculo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ServiciosViaje",
                columns: table => new
                {
                    IdServicio = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Origen = table.Column<string>(type: "TEXT", nullable: false),
                    Destino = table.Column<string>(type: "TEXT", nullable: false),
                    FechaSalida = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaLlegadaEstimada = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Estado = table.Column<string>(type: "TEXT", nullable: false, defaultValue: "Programado"),
                    IdVehiculo = table.Column<int>(type: "INTEGER", nullable: false),
                    IdEmpleado = table.Column<int>(type: "INTEGER", nullable: false),
                    Observaciones = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiciosViaje", x => x.IdServicio);
                    table.ForeignKey(
                        name: "FK_ServiciosViaje_Vehiculo_IdVehiculo",
                        column: x => x.IdVehiculo,
                        principalTable: "Vehiculo",
                        principalColumn: "IdVehiculo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reporte_IdVehiculo",
                table: "Reporte",
                column: "IdVehiculo");

            migrationBuilder.CreateIndex(
                name: "IX_ServiciosViaje_IdVehiculo",
                table: "ServiciosViaje",
                column: "IdVehiculo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Empleados");

            migrationBuilder.DropTable(
                name: "Reporte");

            migrationBuilder.DropTable(
                name: "ServiciosViaje");

            migrationBuilder.DropTable(
                name: "Vehiculo");
        }
    }
}
