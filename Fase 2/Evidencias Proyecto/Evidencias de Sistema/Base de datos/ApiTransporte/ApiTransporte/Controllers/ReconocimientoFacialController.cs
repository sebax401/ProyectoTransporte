using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Web;
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
                // Soporte seguro para formato plano y anidado de appsettings/Render
                var url = _configuration["Supabase:Url"] ?? _configuration["Supabase__Url"];
                var key = _configuration["Supabase:ServiceRoleKey"] ?? _configuration["Supabase__ServiceRoleKey"];
                
                if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key))
                {
                    return StatusCode(500, new { message = "Faltan las credenciales de Supabase en la configuración del servidor." });
                }

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

                // Umbral optimizado para evitar rechazos por milésimas en variaciones de luz/cámara
                if (similarity > 0.55)
                {
                    try
                    {
                        // Hacer petición HTTP a la API Admin de Supabase para generar el token
                        using var httpClient = new HttpClient();
                        httpClient.DefaultRequestHeaders.Add("apikey", key);
                        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");

                        var payload = new 
                        { 
                            type = "magiclink", 
                            email = request.Email 
                        };
                        
                        var content = new StringContent(
                            JsonSerializer.Serialize(payload), 
                            Encoding.UTF8, 
                            "application/json"
                        );

                        var response = await httpClient.PostAsync($"{url}/auth/v1/admin/generate_link", content);

                        if (!response.IsSuccessStatusCode)
                        {
                            var errorBody = await response.Content.ReadAsStringAsync();
                            return StatusCode(500, new { message = "Error al generar sesión en Supabase", details = errorBody });
                        }

                        // Extraer la URL generada en la respuesta
                        var responseBody = await response.Content.ReadAsStringAsync();
                        using var jsonDoc = JsonDocument.Parse(responseBody);
                        
                        var actionLink = string.Empty;
                        if (jsonDoc.RootElement.TryGetProperty("action_link", out var actionLinkProp))
                        {
                            actionLink = actionLinkProp.GetString();
                        }
                        else if (jsonDoc.RootElement.TryGetProperty("properties", out var propsProp) && propsProp.TryGetProperty("action_link", out var innerLinkProp))
                        {
                            actionLink = innerLinkProp.GetString();
                        }

                        if (string.IsNullOrEmpty(actionLink))
                        {
                            return StatusCode(500, new { message = "No se pudo extraer el enlace de acción de la respuesta de Supabase." });
                        }

                        // Extraer el 'token' exacto de la URL usando System.Web.HttpUtility
                        var uri = new Uri(actionLink);
                        var queryParams = HttpUtility.ParseQueryString(uri.Query);
                        var tokenDeSupabase = queryParams["token"];

                        if (string.IsNullOrEmpty(tokenDeSupabase))
                        {
                            return StatusCode(500, new { message = "El token extraído de Supabase es nulo o vacío." });
                        }

                        // Devolver a Angular el token real de Supabase
                        return Ok(new 
                        { 
                            token = tokenDeSupabase, 
                            message = "Rostro validado exitosamente", 
                            similarity = similarity 
                        });
                    }
                    catch (Exception innerEx)
                    {
                        return StatusCode(500, new { message = "Error interno procesando sesión", error = innerEx.Message });
                    }
                }

                return Unauthorized(new { message = "El rostro no coincide.", similarity = similarity });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // Función matemática para comparar similitud de vectores
        private double CalcularSimilitudCoseno(double[] vecA, double[] vecB)
        {
            if (vecA == null || vecB == null || vecA.Length != vecB.Length) return 0;

            double dotProduct = 0, normA = 0, normB = 0;
            for (int i = 0; i < vecA.Length; i++)
            {
                dotProduct += vecA[i] * vecB[i];
                normA += Math.Pow(vecA[i], 2);
                normB += Math.Pow(vecB[i], 2);
            }
            
            if (normA == 0 || normB == 0) return 0;

            return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }
    }

    // --- MODELOS DE DATOS ---

    public class BiometricRequest
    {
        public string Email { get; set; }
        public double[] CurrentEmbedding { get; set; }
    }

    [Table("perfiles")]
    public class Perfil : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }

        [Column("email")]
        public string Email { get; set; }
    }

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