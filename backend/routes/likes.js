const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authenticate = require('../middleware/authenticate'); // ✅ 인증 미들웨어 불러오기

// 좋아요 추가
router.post('/', authenticate, async (req, res) => {
  const post_id = req.params.postId;
  const user_id = req.user.userId; // ✅ 토큰에서 꺼내옴

  try {
    const result = await pool.query(
      `INSERT INTO Likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING *`,
      [post_id, user_id]
    );

    res.status(result.rows.length ? 201 : 200).json(
      result.rows[0] || { message: '이미 좋아요를 누른 게시물입니다.' }
    );
  } catch (err) {
    console.error('좋아요 추가 오류:', err);
    res.status(500).json({ error: '좋아요 추가 실패' });
  }
});

// 좋아요 취소
router.delete('/', authenticate, async (req, res) => {
  const post_id = req.params.postId;
  const user_id = req.user.userId; // ✅ 토큰에서 꺼내옴

  try {
    await pool.query(
      `DELETE FROM Likes WHERE post_id = $1 AND user_id = $2`,
      [post_id, user_id]
    );
    res.json({ message: '좋아요 취소 완료' });
  } catch (err) {
    console.error('좋아요 삭제 오류:', err);
    res.status(500).json({ error: '좋아요 취소 실패' });
  }
});

module.exports = router;
