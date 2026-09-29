using System.ComponentModel.DataAnnotations;

namespace ApiTransporte.Models
{
    public class Vehiculo
    {
        [Key]
        public int IdVehiculo { get; set; }

        public string Patente { get; set; } = string.Empty;
        public string? Marca { get; set; }
        public string Modelo { get; set; } = string.Empty;
        public int Anio { get; set; }
        public int? ProximoKilometraje { get; set; }
        public string? FechaUltimaMantencion { get; set; }
        public string? FechaProximaMantencion { get; set; }
        public string? FechaRevisionTecnica { get; set; }
        public string? EstadoDpf { get; set; }
        public string? EstadoRevision { get; set; }
        public string? EstadoExtintor { get; set; }
        public string? Observacion { get; set; }
        public int? IdConductor { get; set; }
        public bool Estado { get; set; }

        public ICollection<Reporte>? Reportes { get; set; }
    }
}