const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type === "client") {
      // Client-user JWT: { clientUserId, clientId, type: "client" }
      req.clientUser = payload;
      req.user = null;
    } else {
      // Agency JWT: { id, email, role }
      req.user = payload;
      req.clientUser = null;
    }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Agency-only routes: reject client JWTs
function requireAgency(req, res, next) {
  if (!req.user) return res.status(403).json({ error: "Acesso restrito à agência" });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Permissão negada" });
    }
    next();
  };
}

module.exports = { authMiddleware, requireAgency, requireRole };
