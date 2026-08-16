const { isAllowedOrigin } = require("../config/allowedOrigins");

const requireTrustedOrigin = (req, res, next) => {
  const origin = req.get("origin");
  const fetchSite = req.get("sec-fetch-site");

  if (fetchSite === "cross-site" || (origin && !isAllowedOrigin(origin))) {
    return res.status(403).json({ message: "Untrusted request origin" });
  }

  next();
};

module.exports = requireTrustedOrigin;
