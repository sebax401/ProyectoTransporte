namespace ApiTransporte.Models
{
    public class ServicioViajeDto
    {
        public int IdServicio { get; set; }
        public string Origen { get; set; } = string.Empty;
        public string Destino { get; set; } = string.Empty;
        public DateTime FechaSalida { get; set; }
        public DateTime? FechaLlegadaEstimada { get; set; }
        public string Estado { get; set; } = "Programado";
        public int IdVehiculo { get; set; }
        public int IdEmpleado { get; set; }
        public string PatenteVehiculo { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
    }
}