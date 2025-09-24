const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authenticate = require('../middleware/authenticate'); // 인증 미들웨어

// -------------------------------
// 좋아요 추가
// -------------------------------
router.post('/', authenticate, async (req, res) => {
  const post_id = req.params.postId;
  const user_id = req.user.userId;

  try {
    // 좋아요 추가
    await pool.query(
      `INSERT INTO Likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [post_id, user_id]
    );

    // 좋아요 수 & 현재 사용자가 좋아요 눌렀는지 조회
    const postRes = await pool.query(
      `SELECT COUNT(*) AS like_count,
              EXISTS(SELECT 1 FROM Likes l WHERE l.post_id=$1 AND l.user_id=$2) AS is_liked
       FROM Likes
       WHERE post_id = $1`,
      [post_id, user_id]
    );

    const { like_count, is_liked } = postRes.rows[0];
    res.status(201).json({ like_count: parseInt(like_count), is_liked });

  } catch (err) {
    console.error('좋아요 추가 오류:', err);
    res.status(500).json({ error: '좋아요 추가 실패' });
  }
});

// -------------------------------
// 좋아요 취소
// -------------------------------
router.delete('/', authenticate, async (req, res) => {
  const post_id = req.params.postId;
  const user_id = req.user.userId;

  try {
    // 좋아요 삭제
    await pool.query(
      `DELETE FROM Likes WHERE post_id = $1 AND user_id = $2`,
      [post_id, user_id]
    );

    // 좋아요 수 & 현재 사용자가 좋아요 눌렀는지 조회
    const postRes = await pool.query(
      `SELECT COUNT(*) AS like_count,
              EXISTS(SELECT 1 FROM Likes l WHERE l.post_id=$1 AND l.user_id=$2) AS is_liked
       FROM Likes
       WHERE post_id = $1`,
      [post_id, user_id]
    );

    const { like_count, is_liked } = postRes.rows[0];
    res.json({ like_count: parseInt(like_count), is_liked });

  } catch (err) {
    console.error('좋아요 삭제 오류:', err);
    res.status(500).json({ error: '좋아요 취소 실패' });
  }
});

// -------------------------------
// 특정 게시물 좋아요 상태 조회 (새로고침용)
// -------------------------------
router.get('/', authenticate, async (req, res) => {
  const post_id = req.params.postId;
  const user_id = req.user.userId;

  try {
    const postRes = await pool.query(
      `SELECT COUNT(*) AS like_count,
              EXISTS(SELECT 1 FROM Likes l WHERE l.post_id=$1 AND l.user_id=$2) AS is_liked
       FROM Likes
       WHERE post_id = $1`,
      [post_id, user_id]
    );

    if (!postRes.rows.length) return res.status(404).json({ error: '게시물 없음' });

    const { like_count, is_liked } = postRes.rows[0];
    res.json({ like_count: parseInt(like_count), is_liked });

  } catch (err) {
    console.error('좋아요 상태 조회 오류:', err);
    res.status(500).json({ error: '좋아요 상태 조회 실패' });
  }
});

module.exports = router;
