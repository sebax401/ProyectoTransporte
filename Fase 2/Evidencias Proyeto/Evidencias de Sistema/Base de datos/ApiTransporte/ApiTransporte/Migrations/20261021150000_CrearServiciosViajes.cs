using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiTransporte.Migrations
{
    public partial class CrearServiciosViajes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiciosViaje",
                columns: table => new
                {
                    IdServicio = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Origen = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Destino = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    FechaSalida = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaLlegadaEstimada = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Estado = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "Programado"),
                    IdVehiculo = table.Column<int>(type: "INTEGER", nullable: false),
                    Observaciones = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
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
                name: "IX_ServiciosViaje_IdVehiculo",
                table: "ServiciosViaje",
                column: "IdVehiculo");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ServiciosViaje");
        }
    }
}