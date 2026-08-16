const requireRole = (requiredRole) => (req, res, next) => {
  const normalizedRole = requiredRole.toLowerCase();
  const hasRole = Array.isArray(req.roles)
    ? req.roles.some((role) => role.toLowerCase() === normalizedRole)
    : false;

  if (!hasRole) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

module.exports = requireRole;
