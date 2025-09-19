// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const multer = require('multer');
const path = require('path');

// 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 내 프로필 조회
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, intro, profile_img FROM users WHERE user_id=$1', [req.user.userId]);
    res.json({ user: result.rows[0] });
  } catch {
    res.status(500).json({ message: '서버 오류' });
  }
});

// 프로필 수정
router.post('/update-profile', authenticate, upload.single('profilePic'), async (req, res) => {
  const { username, intro } = req.body;
  let profileImgUrl = null;
  if (req.file) profileImgUrl = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(
      'UPDATE users SET username=$1, intro=$2, profile_img=$3 WHERE user_id=$4 RETURNING username, intro, profile_img',
      [username, intro, profileImgUrl, req.user.userId]
    );

    res.json({
      message: '프로필 업데이트 성공',
      user: {
        username: result.rows[0].username,
        intro: result.rows[0].intro,
        profileImgUrl: result.rows[0].profile_img
      }
    });
  } catch {
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
