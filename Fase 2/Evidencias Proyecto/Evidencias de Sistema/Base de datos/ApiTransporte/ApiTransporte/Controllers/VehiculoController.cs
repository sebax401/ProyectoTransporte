using ApiTransporte.Data;
using ApiTransporte.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace ApiTransporte.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VehiculosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public VehiculosController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehiculo>>> GetVehiculos()
        {
            return await _context.Vehiculo.ToListAsync();
        }

        [HttpGet("{id}/reportes")]
        public async Task<ActionResult<IEnumerable<Reporte>>> ObtenerReportesVehiculo(int id)
        {
            var reportes = await _context.Reporte
                .Where(r => r.IdVehiculo == id)
                .ToListAsync();

            return Ok(reportes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vehiculo>> GetVehiculo(int id)
        {
            var vehiculo = await _context.Vehiculo.FindAsync(id);

            if (vehiculo == null)
            {
                return NotFound();
            }

            return vehiculo;
        }

        [HttpPost]
        public async Task<ActionResult<Vehiculo>> PostVehiculo(Vehiculo vehiculo)
        {
            _context.Vehiculo.Add(vehiculo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehiculo), new { id = vehiculo.IdVehiculo }, vehiculo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehiculo(int id, Vehiculo vehiculo)
        {
            if (id != vehiculo.IdVehiculo)
            {
                return BadRequest();
            }

            _context.Entry(vehiculo).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Vehiculo.Any(e => e.IdVehiculo == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehiculo(int id)
        {
            var vehiculo = await _context.Vehiculo.FindAsync(id);

            if (vehiculo == null)
            {
                return NotFound();
            }

            _context.Vehiculo.Remove(vehiculo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/foto")]
        public async Task<IActionResult> SubirFotoVehiculo(int id, IFormFile foto)
        {
            var vehiculo = await _context.Vehiculo.FindAsync(id);

            if (vehiculo == null)
            {
                return NotFound("Vehículo no encontrado.");
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

            var carpeta = Path.Combine(webRoot, "fotos-vehiculos");

            Directory.CreateDirectory(carpeta);

            var nombreArchivo = $"vehiculo_{id}_{Guid.NewGuid()}{extension}";
            var rutaArchivo = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaArchivo, FileMode.Create))
            {
                await foto.CopyToAsync(stream);
            }

            vehiculo.FotoUrl = $"/fotos-vehiculos/{nombreArchivo}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Foto subida correctamente.",
                fotoUrl = vehiculo.FotoUrl
            });
        }
        [HttpGet("foto-test/{nombreArchivo}")]
        public IActionResult FotoTest(string nombreArchivo)
        {
            var webRoot = _env.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRoot))
            {
                webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
            }

            var rutaArchivo = Path.Combine(
                webRoot,
                "fotos-vehiculos",
                nombreArchivo
            );

            if (!System.IO.File.Exists(rutaArchivo))
            {
                return NotFound(new
                {
                    mensaje = "Archivo no encontrado",
                    ruta = rutaArchivo
                });
            }

            var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();

            var contentType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };

            return PhysicalFile(rutaArchivo, contentType);
        }
    }
}