const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

router.post('/update-profile', authenticate, async (req, res) => {
  const { username, profile_img } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'UPDATE users SET username=$1, profile_img=$2 WHERE user_id=$3 RETURNING user_id, username, email, profile_img',
      [username, profile_img, userId]
    );

    res.json({ message: '프로필 업데이트 성공', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
