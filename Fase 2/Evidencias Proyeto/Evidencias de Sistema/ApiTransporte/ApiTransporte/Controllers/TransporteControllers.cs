using ApiTransporte.Data;
using ApiTransporte.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiTransporte.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmpleadoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmpleadoController(AppDbContext context)
        {
            _context = context;
        }

        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Empleados>>> GetEmpleados()
        {
            return await _context.Empleados
                .OrderBy(e => e.Apellido)
                .ThenBy(e => e.Nombre)
                .ToListAsync();
        }

      
        [HttpGet("{id}")]
        public async Task<ActionResult<Empleados>> GetEmpleado(int id)
        {
            var empleado = await _context.Empleados.FindAsync(id);

            if (empleado == null)
            {
                return NotFound(new
                {
                    mensaje = "Empleado no encontrado"
                });
            }

            return Ok(empleado);
        }

      
        [HttpPost]
        public async Task<ActionResult<Empleados>> CrearEmpleado(Empleados empleado)
        {
            if (string.IsNullOrWhiteSpace(empleado.Nombre) ||
                string.IsNullOrWhiteSpace(empleado.Apellido) ||
                string.IsNullOrWhiteSpace(empleado.Rut))
            {
                return BadRequest(new
                {
                    mensaje = "Nombre, apellido y RUT son obligatorios"
                });
            }

            empleado.IdEmpleado = 0;

            if (empleado.FechaIngreso == default)
            {
                empleado.FechaIngreso = DateTime.UtcNow;
            }

            if (string.IsNullOrWhiteSpace(empleado.Estado))
            {
                empleado.Estado = "Activo";
            }

            _context.Empleados.Add(empleado);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetEmpleado),
                new { id = empleado.IdEmpleado },
                empleado
            );
        }

       
        [HttpPut("{id}")]
        public async Task<IActionResult> ModificarEmpleado(
            int id,
            Empleados empleado)
        {
            if (id != empleado.IdEmpleado)
            {
                return BadRequest(new
                {
                    mensaje = "El ID no coincide"
                });
            }

            var empleadoExistente =
                await _context.Empleados.FindAsync(id);

            if (empleadoExistente == null)
            {
                return NotFound(new
                {
                    mensaje = "Empleado no encontrado"
                });
            }

            empleadoExistente.Nombre = empleado.Nombre;
            empleadoExistente.Apellido = empleado.Apellido;
            empleadoExistente.Rut = empleado.Rut;
            empleadoExistente.Cargo = empleado.Cargo;
            empleadoExistente.TipoContrato = empleado.TipoContrato;
            empleadoExistente.Estado = empleado.Estado;
            empleadoExistente.FechaIngreso = empleado.FechaIngreso;
            empleadoExistente.FechaTermino = empleado.FechaTermino;
            empleadoExistente.RazonDespido = empleado.RazonDespido;
            empleadoExistente.Observaciones = empleado.Observaciones;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarEmpleado(int id)
        {
            var empleado =
                await _context.Empleados.FindAsync(id);

            if (empleado == null)
            {
                return NotFound();
            }

            _context.Empleados.Remove(empleado);

            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpPost("{id}/foto")]
        public async Task<IActionResult> SubirFotoEmpleado(int id, IFormFile foto)
        {
            // _context.Empleados coincide con DbSet<Empleados> Empleados en AppDbContext
            var empleado = await _context.Empleados.FindAsync(id);

            if (empleado == null)
            {
                return NotFound("Empleado no encontrado.");
            }

            if (foto == null || foto.Length == 0)
            {
                return BadRequest("No se recibió ninguna imagen.");
            }

            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(foto.FileName).ToLowerInvariant();

            if (!extensionesPermitidas.Contains(extension))
            {
                return BadRequest("Formato de imagen no permitido.");
            }

            if (foto.Length > 5 * 1024 * 1024)
            {
                return BadRequest("La imagen no puede superar los 5 MB.");
            }

            var webRoot = _env.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRoot))
            {
                webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
            }

            var carpeta = Path.Combine(webRoot, "fotos-Empleado");

            Directory.CreateDirectory(carpeta);

            var nombreArchivo = $"empleado_{id}_{Guid.NewGuid()}{extension}";
            var rutaArchivo = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaArchivo, FileMode.Create))
            {
                await foto.CopyToAsync(stream);
            }

            empleado.FotoUrl = $"/fotos-Empleado/{nombreArchivo}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Foto subida correctamente.",
                fotoUrl = empleado.FotoUrl
            });
        }

    }
}