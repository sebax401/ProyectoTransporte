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
    public class ReportesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("vehiculo/{idVehiculo}")]
        public async Task<ActionResult<IEnumerable<Reporte>>> ObtenerReportesVehiculo(int idVehiculo)
        {
            return await _context.Reporte
                .Where(r => r.IdVehiculo == idVehiculo)
                .ToListAsync();
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reporte>>> GetReportes()
        {
            return await _context.Reporte.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Reporte>> CrearReporte(Reporte reporte)
        {
            if (string.IsNullOrWhiteSpace(reporte.FechaGeneracion))
            {
                reporte.FechaGeneracion = DateTime.UtcNow.ToString("o");
            }

            if (!string.IsNullOrWhiteSpace(reporte.NombreRepuesto))
            {
                reporte.Estado = "Solucionada";
            }
            else
            {
                reporte.Estado = "Pendiente";
            }

            _context.Reporte.Add(reporte);
            await _context.SaveChangesAsync();

            return Ok(reporte);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutReporte(int id, Reporte reporte)
        {
            if (id != reporte.IdReporte)
            {
                return BadRequest();
            }

            var reporteExistente = await _context.Reporte.FindAsync(id);

            if (reporteExistente == null)
            {
                return NotFound("Reporte no encontrado.");
            }

            reporteExistente.TipoReporte = reporte.TipoReporte;
            reporteExistente.SubTipoReporte = reporte.SubTipoReporte;
            reporteExistente.FechaGeneracion = reporte.FechaGeneracion;
            reporteExistente.Descripcion = reporte.Descripcion;
            reporteExistente.NombreRepuesto = reporte.NombreRepuesto;
            reporteExistente.ValorRepuesto = reporte.ValorRepuesto;
            reporteExistente.LugarCompra = reporte.LugarCompra;

            if (reporte.Estado == "Solucionada")
            {
                reporteExistente.Estado = "Solucionada";
            }

            await _context.SaveChangesAsync();

            return Ok(reporteExistente);
        }

        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> ActualizarEstadoReporte(int id, [FromBody] string estado)
        {
            var reporte = await _context.Reporte.FindAsync(id);

            if (reporte == null)
            {
                return NotFound("No se encontró el reporte.");
            }

            if (estado != "Pendiente" && estado != "Solucionada")
            {
                return BadRequest("El estado debe ser Pendiente o Solucionada.");
            }

            reporte.Estado = estado;

            await _context.SaveChangesAsync();

            return Ok(reporte);
        }
    }
}