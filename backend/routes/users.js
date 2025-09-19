const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `profile_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// JWT 인증 미들웨어
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: '유효하지 않은 토큰' });
  }
}

// 프로필 수정
router.post('/update-profile', authMiddleware, upload.single('profilePic'), async (req, res) => {
  const { username, intro } = req.body;
  const profileImgUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const query = `
      UPDATE users
      SET username = $1,
          intro = $2,
          profile_img = COALESCE($3, profile_img)
      WHERE user_id = $4
      RETURNING user_id, username, intro, profile_img;
    `;
    const result = await pool.query(query, [username, intro, profileImgUrl, req.userId]);
    res.json({ message: '프로필 업데이트 성공', user: {
      username: result.rows[0].username,
      intro: result.rows[0].intro,
      profilePicUrl: result.rows[0].profile_img
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
