using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiTransporte.Models
{
    public class Reporte
    {
        [Key]
        public int IdReporte { get; set; }

        public string TipoReporte { get; set; } = string.Empty;
        public string FechaGeneracion { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? NombreRepuesto { get; set; }
        public int IdVehiculo { get; set; }
        public decimal? ValorRepuesto { get; set; }
        public string? LugarCompra { get; set; }

        [ForeignKey("IdVehiculo")]public Vehiculo? Vehiculo { get; set; }
    }
}
