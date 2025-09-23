// routes/likes.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // DB 연결 모듈

// 좋아요 추가 API
// POST /likes
router.post('/', async (req, res) => {
  const { post_id, user_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Likes (post_id, user_id)
       VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING *`,
      [post_id, user_id]
    );
    if (result.rows.length > 0) {
      res.status(201).json(result.rows[0]);
    } else {
      res.status(200).json({ message: '이미 좋아요를 누른 게시물입니다.' });
    }
  } catch (err) {
    console.error('좋아요 추가 오류:', err);
    res.status(500).json({ error: '좋아요 추가 실패' });
  }
});

// 좋아요 취소 API
// DELETE /likes
router.delete('/', async (req, res) => {
  const { post_id, user_id } = req.body;
  try {
    await pool.query(
      `DELETE FROM Likes WHERE post_id = $1 AND user_id = $2`,
      [post_id, user_id]
    );
    res.json({ message: '좋아요 취소 완료' });
  } catch (err) {
    console.error('좋아요 취소 오류:', err);
    res.status(500).json({ error: '좋아요 취소 실패' });
  }
});

module.exports = router;
