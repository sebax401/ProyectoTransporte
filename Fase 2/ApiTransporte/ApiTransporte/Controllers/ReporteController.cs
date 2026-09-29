using ApiTransporte.Data;
using ApiTransporte.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiTransporte.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
            reporte.FechaGeneracion = DateTime.UtcNow.ToString("o");

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

            _context.Entry(reporte).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}