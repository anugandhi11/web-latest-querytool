using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace WebQueryTool.API.Controllers
{
    /// <summary>
    /// Login Request DTO
    /// </summary>
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Login Response DTO
    /// </summary>
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new();
        public int ExpiresIn { get; set; }
    }

    /// <summary>
    /// User DTO
    /// </summary>
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
    }

    /// <summary>
    /// Authentication Controller
    ///
    /// Handles user authentication with JWT tokens
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Login endpoint
        /// </summary>
        /// <param name="request">Login credentials</param>
        /// <returns>JWT token and user info</returns>
        /// <response code="200">Login successful</response>
        /// <response code="401">Invalid credentials</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            _logger.LogInformation("Login attempt for user: {Username}", request.Username);

            // TODO: Validate credentials against database
            // For now, use demo credentials
            if (!ValidateCredentials(request.Username, request.Password))
            {
                _logger.LogWarning("Invalid login attempt for user: {Username}", request.Username);
                return Unauthorized(new { error = "Invalid username or password" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(request.Username);

            // Get user info (TODO: from database)
            var user = new UserDto
            {
                Id = Guid.NewGuid().ToString(),
                Username = request.Username,
                Email = $"{request.Username}@verisk.com",
                Roles = new List<string> { "user" }
            };

            // Add admin role for admin user
            if (request.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                user.Roles.Add("admin");
            }

            var expirationMinutes = int.Parse(
                _configuration["Jwt:ExpirationMinutes"] ?? "60");

            _logger.LogInformation("Login successful for user: {Username}", request.Username);

            return Ok(new LoginResponse
            {
                Token = token,
                User = user,
                ExpiresIn = expirationMinutes * 60 // seconds
            });
        }

        /// <summary>
        /// Refresh token endpoint
        /// </summary>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult<LoginResponse> RefreshToken()
        {
            // TODO: Implement token refresh logic
            return Ok(new { message = "Token refresh not yet implemented" });
        }

        /// <summary>
        /// Logout endpoint
        /// </summary>
        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult Logout()
        {
            // TODO: Implement token blacklisting if needed
            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Validate user credentials
        /// TODO: Replace with actual database validation
        /// </summary>
        private bool ValidateCredentials(string username, string password)
        {
            // Demo credentials - replace with database check
            return (username == "admin" && password == "admin123") ||
                   (username == "user" && password == "user123");
        }

        /// <summary>
        /// Generate JWT token
        /// </summary>
        private string GenerateJwtToken(string username)
        {
            var key = _configuration["Jwt:Key"] ??
                throw new InvalidOperationException("JWT Key not configured");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
                new Claim(ClaimTypes.Role, username.Equals("admin", StringComparison.OrdinalIgnoreCase) ? "admin" : "user")
            };

            var expirationMinutes = int.Parse(
                _configuration["Jwt:ExpirationMinutes"] ?? "60");

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
