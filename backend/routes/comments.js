const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');

// POST /posts/:postId/comments
router.post('/', async (req, res) => {
  const { postId } = req.params;
  const { user_id, content } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO Comments (post_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [postId, user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('댓글 작성 오류:', err);
    res.status(500).json({ error: '댓글 작성 실패' });
  }
});

// GET /posts/:postId/comments
router.get('/', async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.*, u.username AS author_name
       FROM Comments c
       LEFT JOIN Users u ON c.user_id = u.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('댓글 불러오기 오류:', err);
    res.status(500).json({ error: '댓글 불러오기 실패' });
  }
});

module.exports = router;
