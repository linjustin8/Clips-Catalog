const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");

const configuredOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const developmentOrigins = ["http://localhost:3000", "http://localhost:5173", "https://clps.us", "https://www.clps.us"].map(normalizeOrigin);

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    ...(process.env.NODE_ENV === "production" ? [] : developmentOrigins),
  ]),
];

const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(normalizeOrigin(origin));

module.exports = { allowedOrigins, isAllowedOrigin };
