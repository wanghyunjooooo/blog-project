// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, hashed]
    );

    res.json({ message: '회원가입 성공', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: '이미 존재하는 이메일 또는 닉네임' });
    res.status(500).json({ message: '서버 오류' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!result.rows.length) return res.status(401).json({ message: '사용자 없음' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: '비밀번호 틀림' });

    const token = jwt.sign({ userId: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: '로그인 성공',
      user: { userId: user.user_id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
