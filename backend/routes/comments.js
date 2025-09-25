const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authenticate = require('../middleware/authenticate'); // 인증 미들웨어

// ----------------- POST /posts/:postId/comments -----------------
router.post('/', authenticate, async (req, res) => {
  const { postId } = req.params;
  const user_id = req.user.userId;          // 로그인한 유저
  const { content } = req.body;             // 댓글 내용

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
      `SELECT user_id, title FROM posts WHERE post_id = $1`,
      [postId]
    );
    if (!postOwnerResult.rows.length) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    const postOwnerId = Number(postOwnerResult.rows[0].user_id);
    const postTitle = postOwnerResult.rows[0].title;

    // 3️⃣ 댓글 작성자와 게시글 작성자가 다르면 알림 생성
    if (postOwnerId !== user_id) {
      // 이미 존재하는 읽지 않은 댓글 알림 확인 (중복 방지)
      const existingNotif = await pool.query(
        `SELECT 1 FROM Notifications
         WHERE user_id = $1 AND post_id = $2 AND type = '댓글' AND is_read = false`,
        [postOwnerId, postId]
      );

      if (!existingNotif.rows.length) {
        const message = `${req.user.username || '누군가'}님이 "${postTitle}" 글에 댓글을 남겼습니다: "${content}"`;

        await pool.query(
          `INSERT INTO Notifications (user_id, type, message, post_id, actor_name, post_title, comment)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [postOwnerId, '댓글', message, postId, req.user.username || '누군가', postTitle, content]
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
