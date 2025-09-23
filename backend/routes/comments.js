// routes/comments.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // DB 연결 모듈

// 댓글 작성 API
// POST /comments
router.post('/', async (req, res) => {
  const { post_id, user_id, content } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Comments (post_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [post_id, user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('댓글 작성 오류:', err);
    res.status(500).json({ error: '댓글 작성 실패' });
  }
});

// 댓글 삭제 API
// DELETE /comments/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM Comments WHERE comment_id = $1`, [id]);
    res.json({ message: '댓글 삭제 완료' });
  } catch (err) {
    console.error('댓글 삭제 오류:', err);
    res.status(500).json({ error: '댓글 삭제 실패' });
  }
});

module.exports = router;
