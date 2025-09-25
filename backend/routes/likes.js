const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authenticate = require('../middleware/authenticate'); // 인증 미들웨어

// -------------------------------
// 좋아요 추가
// -------------------------------
router.post('/', authenticate, async (req, res) => {
  const post_id = parseInt(req.params.postId);
  const user_id = req.user.userId;

  try {
    // 1️⃣ Likes 테이블에 좋아요 추가
    await pool.query(
      `INSERT INTO Likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [post_id, user_id]
    );

    // 2️⃣ 게시글 작성자 조회
    const postRes = await pool.query(
      `SELECT user_id, title FROM Posts WHERE post_id = $1`,
      [post_id]
    );

    if (!postRes.rows.length) {
      return res.status(404).json({ error: '게시물 없음' });
    }

    const postOwnerId = postRes.rows[0].user_id;
    const postTitle = postRes.rows[0].title;

    // 3️⃣ 작성자가 좋아요 누른 사람과 다르면 알림 생성
    if (postOwnerId !== user_id) {
      // 이미 읽지 않은 좋아요 알림 있는지 확인
      const existing = await pool.query(
        `SELECT 1 FROM Notifications
         WHERE user_id = $1 AND post_id = $2 AND type = '좋아요' AND is_read = false`,
        [postOwnerId, post_id]
      );

      if (!existing.rows.length) {
        // 알림 생성 (actor_name, post_title 포함)
        await pool.query(
          `INSERT INTO Notifications (user_id, type, message, post_id, actor_name, post_title)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            postOwnerId,
            '좋아요',
            `${req.user.username || '누군가'}님이 "${postTitle}" 글을 좋아합니다.`,
            post_id,
            req.user.username || '누군가',
            postTitle
          ]
        );
        console.log(`좋아요 알림 생성됨: post_id=${post_id}, user_id=${postOwnerId}`);
      }
    }

    // 4️⃣ 좋아요 수 & 현재 사용자가 좋아요 눌렀는지 조회
    const likeCountRes = await pool.query(
      `SELECT COUNT(*) AS like_count,
              EXISTS(SELECT 1 FROM Likes l WHERE l.post_id=$1 AND l.user_id=$2) AS is_liked
       FROM Likes
       WHERE post_id = $1`,
      [post_id, user_id]
    );

    const { like_count, is_liked } = likeCountRes.rows[0];
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
  const post_id = parseInt(req.params.postId);
  const user_id = req.user.userId;

  try {
    // Likes에서 삭제
    await pool.query(
      `DELETE FROM Likes WHERE post_id = $1 AND user_id = $2`,
      [post_id, user_id]
    );

    // 좋아요 수 & 상태 조회
    const likeCountRes = await pool.query(
      `SELECT COUNT(*) AS like_count,
              EXISTS(SELECT 1 FROM Likes l WHERE l.post_id=$1 AND l.user_id=$2) AS is_liked
       FROM Likes
       WHERE post_id = $1`,
      [post_id, user_id]
    );

    const { like_count, is_liked } = likeCountRes.rows[0];
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
  const post_id = parseInt(req.params.postId);
  const user_id = req.user.userId;

  try {
    const likeCountRes = await pool.query(
      `SELECT COUNT(*) AS like_count,
              EXISTS(SELECT 1 FROM Likes l WHERE l.post_id=$1 AND l.user_id=$2) AS is_liked
       FROM Likes
       WHERE post_id = $1`,
      [post_id, user_id]
    );

    if (!likeCountRes.rows.length) return res.status(404).json({ error: '게시물 없음' });

    const { like_count, is_liked } = likeCountRes.rows[0];
    res.json({ like_count: parseInt(like_count), is_liked });

  } catch (err) {
    console.error('좋아요 상태 조회 오류:', err);
    res.status(500).json({ error: '좋아요 상태 조회 실패' });
  }
});

module.exports = router;
