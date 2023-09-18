const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_KEY;
const db = require("../_database");
const User = db.User;
const Role = db.ROLES;

function verifyToken(req, res, next) {
  if (!req.headers["authorization"])
    return res.status(403).send({ message: "No authorization data provided!" });

  let token = req.headers["authorization"].split("Bearer ")[1];

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(401).send({ message: "UnauthorizedError" });

    req.userId = decoded.id;
    req.userStatus = decoded.status;
    req.userRole = decoded.role;
    return next();
  });
}

function isAdmin(req, res, next) {
  User.findById(req.userId).exec((err, user) => {
    if (err) throw new Error(err);

    if (user.role === Role.ADMIN) return next();
    else return res.status(403).send({ message: "Require Admin Role!" });
  });
}

function isApiUsageLimited(req, res, next) {
  User.findById(req.userId).exec((err, user) => {
    if (err) throw new Error(err);

    if (user.cur_api_call < user.max_api_call) return next();
    else
      return res
        .status(403)
        .send({ message: "Your api usage limit is exceeded!" });
  });
}

module.exports = {
  verifyToken,
  isAdmin,
  isApiUsageLimited,
};
