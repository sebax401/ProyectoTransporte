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
            var url = _configuration["Supabase:Url"];
            var key = _configuration["Supabase:ServiceRoleKey"];
            
            var options = new Supabase.SupabaseOptions { AutoConnectRealtime = false };
            var supabase = new Supabase.Client(url, key, options);
            await supabase.InitializeAsync();

            var perfilesResponse = await supabase.From<Perfil>()
                                                .Where(x => x.Email == request.Email)
                                                .Get();
            
            var perfil = perfilesResponse.Models.FirstOrDefault();
            if (perfil == null) 
                return Unauthorized(new { message = "Usuario no encontrado." });

            var biometriaResponse = await supabase.From<DatosBiometricos>()
                                                .Where(x => x.UserId == perfil.Id)
                                                .Get();

            var biometria = biometriaResponse.Models.FirstOrDefault();
            if (biometria == null || string.IsNullOrEmpty(biometria.FaceEmbedding))
                return Unauthorized(new { message = "El usuario no tiene un rostro registrado." });

            var savedEmbedding = JsonSerializer.Deserialize<double[]>(biometria.FaceEmbedding);
            double similarity = CalcularSimilitudCoseno(request.CurrentEmbedding, savedEmbedding);

            if (similarity > 0.55)
            {
            try
            {
                // 1. Obtener credenciales desde Render
                var supabaseUrl = _configuration["Supabase__Url"];
                var serviceRoleKey = _configuration["Supabase__ServiceRoleKey"];

                // 2. Hacer petición HTTP a la API Admin de Supabase para generar el token
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {serviceRoleKey}");

                var payload = new 
                { 
                    type = "magiclink", 
                    email = request.Email // Usamos el correo que recibes en el request
                };
                
                var content = new StringContent(
                    System.Text.Json.JsonSerializer.Serialize(payload), 
                    System.Text.Encoding.UTF8, 
                    "application/json"
                );

                var response = await httpClient.PostAsync($"{supabaseUrl}/auth/v1/admin/generate_link", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    return StatusCode(500, new { message = "Error al generar sesión en Supabase", details = errorBody });
                }

                // 3. Extraer la URL generada en la respuesta
                var responseBody = await response.Content.ReadAsStringAsync();
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(responseBody);
                var actionLink = jsonDoc.RootElement.GetProperty("action_link").GetString();

                // 4. Extraer el 'token' exacto de la URL (ejemplo: .../verify?token=abc1234&type=magiclink)
                var uri = new Uri(actionLink);
                var queryParams = System.Web.HttpUtility.ParseQueryString(uri.Query);
                var tokenDeSupabase = queryParams["token"];

                // 5. Devolver a Angular el token real de Supabase
                return Ok(new 
                { 
                    token = tokenDeSupabase, 
                    message = "Rostro validado exitosamente", 
                    similarity = similarity 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno procesando sesión", error = ex.Message });
            }
        }

            return Unauthorized(new { message = "El rostro no coincide.", similarity = similarity });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, stackTrace = ex.StackTrace });
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