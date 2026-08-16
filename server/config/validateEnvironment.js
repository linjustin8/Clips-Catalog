const validateEnvironment = () => {
  const validNodeEnvironments = new Set(["development", "test", "production"]);
  if (!validNodeEnvironments.has(process.env.NODE_ENV)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const accessSecret = process.env.ACCESS_TOKEN_SECRET || "";
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "";

  if (!accessSecret || !refreshSecret) {
    throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are required");
  }

  if (accessSecret === refreshSecret) {
    throw new Error("Access and refresh token secrets must be different");
  }

  if (process.env.NODE_ENV !== "production") return;

  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error("Production token secrets must be at least 32 characters long");
  }

  const clientOrigins = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!clientOrigins.length) {
    throw new Error("CLIENT_ORIGINS is required in production");
  }

  for (const origin of clientOrigins) {
    const url = new URL(origin);
    if (url.protocol !== "https:") {
      throw new Error("Production CLIENT_ORIGINS entries must use HTTPS");
    }
  }
};

module.exports = validateEnvironment;
