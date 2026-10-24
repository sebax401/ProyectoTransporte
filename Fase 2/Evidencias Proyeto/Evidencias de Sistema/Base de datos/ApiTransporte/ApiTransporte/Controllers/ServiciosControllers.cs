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

        // GET api/Servicios?vehiculoId=3
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServicioViajeDto>>> ObtenerServicios(
            [FromQuery] int? vehiculoId = null)
        {
            var consulta = _context.ServiciosViaje.AsNoTracking();

            if (vehiculoId.HasValue)
            {
                if (vehiculoId.Value <= 0)
                {
                    return BadRequest(new { mensaje = "El filtro de vehículo no es válido." });
                }

                consulta = consulta.Where(s => s.IdVehiculo == vehiculoId.Value);
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
                    PatenteVehiculo = vehiculo.Patente,
                    IdEmpleado = servicio.IdEmpleado,
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
                return NotFound(new { mensaje = "El servicio o viaje no existe." });
            }

            return Ok(servicio);
        }

        [HttpPost]
        public async Task<ActionResult<ServicioViajeDto>> CrearServicio([FromBody] ServicioViajeDto dto)
        {
            var errorValidacion = await ValidarServicioDto(dto);
            if (errorValidacion != null)
            {
                return BadRequest(new { mensaje = errorValidacion });
            }

            var nuevaEntidad = new ServicioViaje
            {
                Origen = dto.Origen.Trim(),
                Destino = dto.Destino.Trim(),
                FechaSalida = dto.FechaSalida,
                FechaLlegadaEstimada = dto.FechaLlegadaEstimada,
                Estado = NormalizarEstado(dto.Estado),
                IdVehiculo = dto.IdVehiculo,
                IdEmpleado = dto.IdEmpleado,
                Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones) ? null : dto.Observaciones.Trim()
            };

            _context.ServiciosViaje.Add(nuevaEntidad);
            await _context.SaveChangesAsync();

            var creado = await ObtenerDto(nuevaEntidad.IdServicio);
            return CreatedAtAction(nameof(ObtenerServicio), new { id = nuevaEntidad.IdServicio }, creado);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ServicioViajeDto>> ActualizarServicio(
            int id,
            [FromBody] ServicioViajeDto cambios)
        {
            if (id != cambios.IdServicio)
            {
                return BadRequest(new { mensaje = "El identificador de la URL no coincide con el servicio." });
            }

            var existente = await _context.ServiciosViaje.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { mensaje = "El servicio o viaje no existe." });
            }

            var errorValidacion = await ValidarServicioDto(cambios);
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
            existente.Observaciones = string.IsNullOrWhiteSpace(cambios.Observaciones)
                ? null
                : cambios.Observaciones.Trim();

            await _context.SaveChangesAsync();
            return Ok(await ObtenerDto(id));
        }

        private async Task<string?> ValidarServicioDto(ServicioViajeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Origen))
                return "El origen es obligatorio.";

            if (string.IsNullOrWhiteSpace(dto.Destino))
                return "El destino es obligatorio.";

            if (dto.Origen.Trim().Length > 120 || dto.Destino.Trim().Length > 120)
                return "El origen y el destino no pueden superar los 120 caracteres.";

            if (string.Equals(dto.Origen.Trim(), dto.Destino.Trim(), StringComparison.OrdinalIgnoreCase))
                return "El origen y el destino deben ser diferentes.";

            if (dto.FechaSalida == default)
                return "La fecha y hora de salida son obligatorias.";

            if (dto.FechaLlegadaEstimada.HasValue &&
                dto.FechaLlegadaEstimada.Value <= dto.FechaSalida)
                return "La llegada estimada debe ser posterior a la salida.";

            if (!EstadosPermitidos.Contains(dto.Estado?.Trim() ?? string.Empty, StringComparer.OrdinalIgnoreCase))
                return "El estado debe ser Programado, En curso, Finalizado o Cancelado.";

            var vehiculoExiste = await _context.Vehiculo
                .AnyAsync(v => v.IdVehiculo == dto.IdVehiculo);
            if (!vehiculoExiste)
                return "Debe seleccionar un vehículo registrado.";

            var empleadoExiste = await _context.Empleado
                .AnyAsync(e => e.IdEmpleado == dto.IdEmpleado);
            if (!empleadoExiste)
                return "Debe seleccionar un conductor/empleado registrado.";

            if (!string.IsNullOrWhiteSpace(dto.Observaciones) && dto.Observaciones.Length > 500)
                return "Las observaciones no pueden superar los 500 caracteres.";

            return null;
        }

        private static string NormalizarEstado(string? estado)
        {
            var valor = (estado ?? "").Trim();
            return EstadosPermitidos.First(e =>
                string.Equals(e, valor, StringComparison.OrdinalIgnoreCase));
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
                    PatenteVehiculo = vehiculo.Patente,
                    IdEmpleado = servicio.IdEmpleado,
                    Observaciones = servicio.Observaciones
                }).SingleOrDefaultAsync();
        }
    }
}