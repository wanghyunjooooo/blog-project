const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');

// ----------------- POST /posts/:postId/comments -----------------
router.post('/', async (req, res) => {
  const { postId } = req.params;
  const { user_id, content } = req.body; // 댓글 작성자

  try {
    // 1️⃣ 댓글 저장
    const commentResult = await pool.query(
      `INSERT INTO Comments (post_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [postId, user_id, content]
    );
    const comment = commentResult.rows[0];

    // 2️⃣ 게시글 작성자 확인
    const postOwnerResult = await pool.query(
      `SELECT user_id FROM posts WHERE post_id = $1`,
      [postId]
    );
    if (!postOwnerResult.rows.length) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    const postOwnerId = Number(postOwnerResult.rows[0].user_id);
    const commenterId = Number(user_id);

    // 3️⃣ 댓글 작성자와 게시글 작성자가 다르면 알림 생성
    if (postOwnerId !== commenterId) {
      // 이미 존재하는 읽지 않은 알림 확인 (중복 방지)
      const existingNotif = await pool.query(
        `SELECT 1 FROM Notifications
         WHERE user_id = $1 AND post_id = $2 AND type = '댓글' AND is_read = false`,
        [postOwnerId, postId]
      );

      if (!existingNotif.rows.length) {
        const message = `새 댓글이 달렸습니다.`; // [댓글] 제거
        await pool.query(
          `INSERT INTO Notifications (user_id, type, message, post_id)
           VALUES ($1, $2, $3, $4)`,
          [postOwnerId, '댓글', message, postId]
        );
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('댓글 작성 오류:', err);
    res.status(500).json({ error: '댓글 작성 실패' });
  }
});

// ----------------- GET /posts/:postId/comments -----------------
router.get('/', async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.comment_id, c.content, c.created_at, u.username AS author_name, u.profile_img
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
