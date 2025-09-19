// backend/middleware/authenticate.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 없음' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: '유효하지 않은 토큰' });
    req.user = decoded; // userId 포함
    next();
  });
}

module.exports = authenticate;
