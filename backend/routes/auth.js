const express = require('express');
const router = express.Router();
const pool = require('../db'); // db.js에서 가져오기
const bcrypt = require('bcrypt');

// =================== 회원가입 ===================
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. 중복 username/email 체크
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: '이미 존재하는 username 또는 email입니다.' });
    }

    // 2. 비밀번호 해시
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. DB 저장
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: '회원가입 성공', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류' });
  }
});

// =================== 로그인 ===================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. 이메일 존재 확인
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: '존재하지 않는 이메일입니다.' });
    }

    const user = userResult.rows[0];

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 틀렸습니다.' });
    }

    // 3. 로그인 성공 (JWT 또는 세션 구현 가능)
    res.status(200).json({ message: '로그인 성공', user: { user_id: user.user_id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
