const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');

// GET /posts/:postId/likes
router.get('/', async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM Likes WHERE post_id = $1`,
      [postId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('좋아요 불러오기 오류:', err);
    res.status(500).json({ error: '좋아요 불러오기 실패' });
  }
});

// POST /posts/:postId/likes
router.post('/', async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Likes (post_id, user_id)
       VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING *`,
      [postId, user_id]
    );
    if (result.rows.length > 0) res.status(201).json(result.rows[0]);
    else res.status(200).json({ message: '이미 좋아요를 누른 게시물입니다.' });
  } catch (err) {
    console.error('좋아요 추가 오류:', err);
    res.status(500).json({ error: '좋아요 추가 실패' });
  }
});

module.exports = router;
