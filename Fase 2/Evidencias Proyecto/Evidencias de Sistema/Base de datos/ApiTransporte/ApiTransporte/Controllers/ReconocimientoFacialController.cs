using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace ApiTransporte.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReconocimientoFacialController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ReconocimientoFacialController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginBiometrico([FromBody] BiometricRequest request)
        {
            try
            {
                // 1. Inicializar Supabase con la llave maestra (Service Role Key) para saltar el RLS
                var url = _configuration["Supabase:Url"];
                var key = _configuration["Supabase:ServiceRoleKey"];
                
                var options = new Supabase.SupabaseOptions { AutoConnectRealtime = false };
                var supabase = new Supabase.Client(url, key, options);
                await supabase.InitializeAsync();

                // 2. Obtener el ID del usuario desde la tabla perfiles usando el correo
                var perfilesResponse = await supabase.From<Perfil>()
                                                     .Where(x => x.Email == request.Email)
                                                     .Get();
                
                var perfil = perfilesResponse.Models.FirstOrDefault();
                if (perfil == null) 
                    return Unauthorized(new { message = "Usuario no encontrado." });

                // 3. Buscar el vector biométrico guardado para ese usuario
                var biometriaResponse = await supabase.From<DatosBiometricos>()
                                                      .Where(x => x.UserId == perfil.Id)
                                                      .Get();

                var biometria = biometriaResponse.Models.FirstOrDefault();
                if (biometria == null || string.IsNullOrEmpty(biometria.FaceEmbedding))
                    return Unauthorized(new { message = "El usuario no tiene un rostro registrado." });

                // 4. Comparar el rostro capturado en Angular con el guardado en Supabase
                var savedEmbedding = JsonSerializer.Deserialize<double[]>(biometria.FaceEmbedding);
                double similarity = CalcularSimilitudCoseno(request.CurrentEmbedding, savedEmbedding);

                // Umbral de 0.65 como lo tienes en tu frontend
                if (similarity > 0.65)
                {
                    // 5. Fabricar el Token JWT usando la configuración de appsettings.json
                    var secretKey = _configuration["JwtSettings:Secret"];
                    var issuer = _configuration["JwtSettings:Issuer"];
                    var audience = _configuration["JwtSettings:Audience"];

                    var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);

                    var tokenDescriptor = new SecurityTokenDescriptor
                    {
                        Subject = new ClaimsIdentity(new[]
                        {
                            new Claim(JwtRegisteredClaimNames.Sub, perfil.Id), // El ID del usuario para Supabase
                            new Claim("aud", audience),                        // Requerido por Supabase (authenticated)
                            new Claim("role", audience),                       // Requerido por Supabase (authenticated)
                            new Claim(JwtRegisteredClaimNames.Email, request.Email)
                        }),
                        Expires = DateTime.UtcNow.AddHours(8), // Duración de la sesión
                        SigningCredentials = credentials,
                        Issuer = issuer,
                        Audience = audience
                    };

                    var tokenHandler = new JwtSecurityTokenHandler();
                    var token = tokenHandler.CreateToken(tokenDescriptor);
                    var jwtString = tokenHandler.WriteToken(token);

                    return Ok(new { token = jwtString, message = "Rostro validado exitosamente", similarity = similarity });
                }

                return Unauthorized(new { message = "El rostro no coincide.", similarity = similarity });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor.", details = ex.Message });
            }
        }

        // Función matemática para comparar similitud de vectores (igual a la de Angular)
        private double CalcularSimilitudCoseno(double[] vecA, double[] vecB)
        {
            double dotProduct = 0, normA = 0, normB = 0;
            for (int i = 0; i < vecA.Length; i++)
            {
                dotProduct += vecA[i] * vecB[i];
                normA += Math.Pow(vecA[i], 2);
                normB += Math.Pow(vecB[i], 2);
            }
            return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }
    }

    // --- MODELOS DE DATOS ---

    public class BiometricRequest
    {
        public string Email { get; set; }
        public double[] CurrentEmbedding { get; set; }
    }

    // Mapeo a tu tabla public.perfiles
    [Table("perfiles")]
    public class Perfil : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }

        [Column("email")]
        public string Email { get; set; }
    }

    // Mapeo a tu tabla public.datos_biometricos
    [Table("datos_biometricos")]
    public class DatosBiometricos : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }

        [Column("user_id")]
        public string UserId { get; set; }

        [Column("face_embedding")]
        public string FaceEmbedding { get; set; }
    }
}