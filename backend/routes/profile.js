// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const multer = require('multer');
const path = require('path');

// ==========================
// 업로드 설정
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==========================
// GET /users/me → 내 프로필 조회
// ==========================
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, intro, profile_img FROM users WHERE user_id=$1',
      [req.user.userId]
    );

    const user = result.rows[0];
    user.profileImgUrl = user.profile_img ? `http://localhost:3000${user.profile_img}` : null;

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ==========================
// GET /users/:id → 특정 유저 정보 조회
// ==========================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT user_id, username, intro, profile_img FROM users WHERE user_id=$1',
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];
    user.profileImgUrl = user.profile_img ? `http://localhost:3000${user.profile_img}` : null;

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ==========================
// POST /users/update-profile → 내 프로필 수정
// ==========================
router.post('/update-profile', authenticate, upload.single('profilePic'), async (req, res) => {
  const { username, intro } = req.body;
  let profileImgUrl = null;
  if (req.file) profileImgUrl = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(
      'UPDATE users SET username=$1, intro=$2, profile_img=$3 WHERE user_id=$4 RETURNING username, intro, profile_img',
      [username, intro, profileImgUrl, req.user.userId]
    );

    const updatedUser = result.rows[0];
    res.json({
      message: '프로필 업데이트 성공',
      user: {
        username: updatedUser.username,
        intro: updatedUser.intro,
        profileImgUrl: updatedUser.profile_img ? `http://localhost:3000${updatedUser.profile_img}` : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ==========================
// PATCH /users/:id → 닉네임(username) 수정
// ==========================
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) return res.status(400).json({ message: 'username required' });

  try {
    const result = await pool.query(
      'UPDATE users SET username=$1 WHERE user_id=$2 RETURNING user_id, username, profile_img',
      [username, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];
    user.profileImgUrl = user.profile_img ? `http://localhost:3000${user.profile_img}` : null;

    res.json({
      success: true,
      message: '닉네임이 업데이트되었습니다',
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
