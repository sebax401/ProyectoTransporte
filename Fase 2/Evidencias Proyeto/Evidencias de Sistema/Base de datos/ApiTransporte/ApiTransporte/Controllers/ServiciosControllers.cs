
using ApiTransporte.Data;
using ApiTransporte.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiTransporte.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ServiciosController : ControllerBase
    {
        private static readonly string[] EstadosPermitidos =
        {
            "Programado", "En curso", "Finalizado", "Cancelado"
        };

        private readonly AppDbContext _context;

        public ServiciosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServicioViajeDto>>> ObtenerServicios(
            [FromQuery] int? vehiculoId = null)
        {
            var consulta = _context.ServiciosViaje.AsNoTracking();

            if (vehiculoId.HasValue)
            {
                if (vehiculoId.Value <= 0)
                {
                    return BadRequest(new
                    {
                        mensaje = "El filtro de vehículo no es válido."
                    });
                }

                consulta = consulta.Where(
                    s => s.IdVehiculo == vehiculoId.Value);
            }

            var servicios = await (
                from servicio in consulta
                join vehiculo in _context.Vehiculo.AsNoTracking()
                    on servicio.IdVehiculo equals vehiculo.IdVehiculo
                orderby servicio.FechaSalida
                select new ServicioViajeDto
                {
                    IdServicio = servicio.IdServicio,
                    Origen = servicio.Origen,
                    Destino = servicio.Destino,
                    FechaSalida = servicio.FechaSalida,
                    FechaLlegadaEstimada = servicio.FechaLlegadaEstimada,
                    Estado = servicio.Estado,
                    IdVehiculo = servicio.IdVehiculo,
                    IdEmpleado = servicio.IdEmpleado,
                    PatenteVehiculo = vehiculo.Patente,
                    Observaciones = servicio.Observaciones
                }).ToListAsync();

            return Ok(servicios);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ServicioViajeDto>> ObtenerServicio(int id)
        {
            var servicio = await ObtenerDto(id);

            if (servicio == null)
            {
                return NotFound(new
                {
                    mensaje = "El servicio o viaje no existe."
                });
            }

            return Ok(servicio);
        }

        [HttpPost]
        public async Task<ActionResult<ServicioViajeDto>> CrearServicio(
            [FromBody] ServicioViaje servicio)
        {
            var errorValidacion = await ValidarServicio(servicio);

            if (errorValidacion != null)
            {
                return BadRequest(new { mensaje = errorValidacion });
            }

            servicio.IdServicio = 0;
            servicio.Origen = servicio.Origen.Trim();
            servicio.Destino = servicio.Destino.Trim();
            servicio.Estado = NormalizarEstado(servicio.Estado);
            servicio.Observaciones =
                string.IsNullOrWhiteSpace(servicio.Observaciones)
                    ? null
                    : servicio.Observaciones.Trim();

            // IdEmpleado se conserva con el valor recibido en el JSON.
            _context.ServiciosViaje.Add(servicio);

            await _context.SaveChangesAsync();

            var creado = await ObtenerDto(servicio.IdServicio);

            return CreatedAtAction(
                nameof(ObtenerServicio),
                new { id = servicio.IdServicio },
                creado);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ServicioViajeDto>> ActualizarServicio(
            int id,
            [FromBody] ServicioViaje cambios)
        {
            if (id != cambios.IdServicio)
            {
                return BadRequest(new
                {
                    mensaje = "El identificador de la URL no coincide con el servicio."
                });
            }

            var existente = await _context.ServiciosViaje.FindAsync(id);

            if (existente == null)
            {
                return NotFound(new
                {
                    mensaje = "El servicio o viaje no existe."
                });
            }

            var errorValidacion = await ValidarServicio(cambios);

            if (errorValidacion != null)
            {
                return BadRequest(new { mensaje = errorValidacion });
            }

            existente.Origen = cambios.Origen.Trim();
            existente.Destino = cambios.Destino.Trim();
            existente.FechaSalida = cambios.FechaSalida;
            existente.FechaLlegadaEstimada = cambios.FechaLlegadaEstimada;
            existente.Estado = NormalizarEstado(cambios.Estado);
            existente.IdVehiculo = cambios.IdVehiculo;
            existente.IdEmpleado = cambios.IdEmpleado;
            existente.Observaciones =
                string.IsNullOrWhiteSpace(cambios.Observaciones)
                    ? null
                    : cambios.Observaciones.Trim();

            await _context.SaveChangesAsync();

            return Ok(await ObtenerDto(id));
        }

        private async Task<string?> ValidarServicio(ServicioViaje servicio)
        {
            if (string.IsNullOrWhiteSpace(servicio.Origen))
                return "El origen es obligatorio.";

            if (string.IsNullOrWhiteSpace(servicio.Destino))
                return "El destino es obligatorio.";

            if (servicio.Origen.Trim().Length > 120 ||
                servicio.Destino.Trim().Length > 120)
                return "El origen y el destino no pueden superar los 120 caracteres.";

            if (string.Equals(
                servicio.Origen.Trim(),
                servicio.Destino.Trim(),
                StringComparison.OrdinalIgnoreCase))
                return "El origen y el destino deben ser diferentes.";

            if (servicio.FechaSalida == default)
                return "La fecha y hora de salida son obligatorias.";

            if (servicio.FechaLlegadaEstimada.HasValue &&
                servicio.FechaLlegadaEstimada.Value <= servicio.FechaSalida)
                return "La llegada estimada debe ser posterior a la salida.";

            if (!EstadosPermitidos.Contains(
                servicio.Estado?.Trim() ?? string.Empty,
                StringComparer.OrdinalIgnoreCase))
                return "El estado debe ser Programado, En curso, Finalizado o Cancelado.";

            var vehiculoExiste = await _context.Vehiculo
                .AnyAsync(v => v.IdVehiculo == servicio.IdVehiculo);

            if (!vehiculoExiste)
                return "Debe seleccionar un vehículo registrado.";

            if (servicio.IdEmpleado <= 0)
                return "Debe seleccionar un conductor.";

            // Se asume que AppDbContext contiene un DbSet llamado Empleado.
            var empleadoExiste = await _context.Empleado
                .AnyAsync(e => e.IdEmpleado == servicio.IdEmpleado);

            if (!empleadoExiste)
                return "El conductor seleccionado no existe.";

            if (!string.IsNullOrWhiteSpace(servicio.Observaciones) &&
                servicio.Observaciones.Length > 500)
                return "Las observaciones no pueden superar los 500 caracteres.";

            return null;
        }

        private static string NormalizarEstado(string? estado)
        {
            var valor = (estado ?? "").Trim();

            return EstadosPermitidos.First(e =>
                string.Equals(
                    e,
                    valor,
                    StringComparison.OrdinalIgnoreCase));
        }

        private Task<ServicioViajeDto?> ObtenerDto(int id)
        {
            return (
                from servicio in _context.ServiciosViaje.AsNoTracking()
                join vehiculo in _context.Vehiculo.AsNoTracking()
                    on servicio.IdVehiculo equals vehiculo.IdVehiculo
                where servicio.IdServicio == id
                select new ServicioViajeDto
                {
                    IdServicio = servicio.IdServicio,
                    Origen = servicio.Origen,
                    Destino = servicio.Destino,
                    FechaSalida = servicio.FechaSalida,
                    FechaLlegadaEstimada = servicio.FechaLlegadaEstimada,
                    Estado = servicio.Estado,
                    IdVehiculo = servicio.IdVehiculo,
                    IdEmpleado = servicio.IdEmpleado,
                    PatenteVehiculo = vehiculo.Patente,
                    Observaciones = servicio.Observaciones
                }).SingleOrDefaultAsync();
        }
    }
}
