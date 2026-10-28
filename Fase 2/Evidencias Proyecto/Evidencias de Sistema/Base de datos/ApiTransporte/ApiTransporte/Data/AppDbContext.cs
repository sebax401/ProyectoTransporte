using ApiTransporte.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiTransporte.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Vehiculo> Vehiculo { get; set; }

        public DbSet<Reporte> Reporte { get; set; }

        public DbSet<Empleados> Empleados { get; set; }

        public DbSet<ServicioViaje> ServiciosViaje { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ServicioViaje>()
                .HasOne<Vehiculo>()
                .WithMany()
                .HasForeignKey(servicio => servicio.IdVehiculo)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ServicioViaje>()
                .Property(servicio => servicio.Estado)
                .HasDefaultValue("Programado");
        } 
    }
}
