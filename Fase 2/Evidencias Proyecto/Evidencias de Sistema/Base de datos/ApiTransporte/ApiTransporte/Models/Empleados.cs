using System.ComponentModel.DataAnnotations;

namespace ApiTransporte.Models
{
    public class Empleados
    {
        [Key]
        public int IdEmpleado { get; set; }

        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public string Apellido { get; set; } = string.Empty;

        [Required]
        public string Rut { get; set; } = string.Empty;

        [Required]
        public string Cargo { get; set; } = string.Empty;

        [Required]
        public string TipoContrato { get; set; } = string.Empty;

        [Required]
        public string Estado { get; set; } = "Activo";

        public DateTime FechaIngreso { get; set; }

        public DateTime? FechaTermino { get; set; }

        public string? RazonDespido { get; set; }

        public string? Observaciones { get; set; }
        
        public string? FotoUrl { get; set; }
    }
}