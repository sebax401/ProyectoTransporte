using System.ComponentModel.DataAnnotations;

namespace ApiTransporte.Models
{
    public class ServicioViaje
    {
        [Key]
        public int IdServicio { get; set; }

        [Required(ErrorMessage = "El origen es obligatorio.")]
        [MaxLength(120)]
        public string Origen { get; set; } = string.Empty;

        [Required(ErrorMessage = "El destino es obligatorio.")]
        [MaxLength(120)]
        public string Destino { get; set; } = string.Empty;

        [Required]
        public DateTime FechaSalida { get; set; }

        public DateTime? FechaLlegadaEstimada { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = "Programado";

        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un vehículo.")]
        public int IdVehiculo { get; set; }
        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un vehículo.")]
        public int IdEmpleado { get; set; }

        [MaxLength(500)]
        public string? Observaciones { get; set; }
    }
}