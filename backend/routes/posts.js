// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/authenticate');

// ====================
// 이미지 업로드 설정
// ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ====================
// helper: userId 안전하게 파싱
// ====================
function getUserId(req) {
  if (req.user && req.user.userId) return parseInt(req.user.userId, 10);
  if (req.query.user_id !== undefined) {
    const n = parseInt(req.query.user_id, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

// ====================
// 게시글 전체 조회 (좋아요 반영)
// ====================
router.get('/', async (req, res) => {
  const userId = getUserId(req) || 0; // 로그인 안 되어도 전체 게시물 조회 가능

  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        u.username AS author_name,
        u.profile_img AS author_profile,
        COALESCE(likes_count.count, 0) AS like_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END AS is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS count
        FROM likes
        GROUP BY post_id
      ) AS likes_count ON likes_count.post_id = p.post_id
      LEFT JOIN likes ul ON ul.post_id = p.post_id AND ul.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('게시글 전체 조회 실패:', err);
    res.status(500).json({ message: '게시글 조회 실패' });
  }
});

// ====================
// 내 글 조회 (마이페이지)
// ====================
router.get('/my-posts', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.user_id=$1
      ORDER BY p.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('내 글 조회 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ====================
// 게시글 작성
// ====================
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.userId;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const insertResult = await pool.query(
      'INSERT INTO posts (user_id, title, content, image_url, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [userId, title, content, image_url]
    );

    const post_id = insertResult.rows[0].post_id;

    const postWithAuthor = await pool.query(
      `
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id=$1
      `,
      [post_id]
    );

    res.json(postWithAuthor.rows[0]);
  } catch (err) {
    console.error('게시글 작성 실패:', err);
    res.status(500).json({ message: '게시글 작성 실패' });
  }
});

// ====================
// 특정 게시글 조회 (좋아요 반영)
// ====================
router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  const userId = getUserId(req) || 0;

  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        u.username AS author_name,
        u.profile_img AS author_profile,
        COALESCE(likes_count.count, 0) AS like_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END AS is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS count
        FROM likes
        GROUP BY post_id
      ) AS likes_count ON likes_count.post_id = p.post_id
      LEFT JOIN likes ul ON ul.post_id = p.post_id AND ul.user_id = $2
      WHERE p.post_id = $1
      `,
      [post_id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: '게시글 없음' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('특정 게시글 조회 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ====================
// 게시글 수정 (본인 글만)
// ====================
router.put('/:post_id', authenticate, upload.single('image'), async (req, res) => {
  const { post_id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.userId;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const check = await pool.query('SELECT * FROM posts WHERE post_id=$1 AND user_id=$2', [post_id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: '권한 없음' });

    await pool.query(
      'UPDATE posts SET title=$1, content=$2, image_url=COALESCE($3, image_url), updated_at=NOW() WHERE post_id=$4',
      [title, content, image_url, post_id]
    );

    const updated = await pool.query(
      `
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id=$1
      `,
      [post_id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error('게시글 수정 실패:', err);
    res.status(500).json({ message: '게시글 수정 실패' });
  }
});

// ====================
// 게시글 삭제 (본인 글만)
// ====================
router.delete('/:post_id', authenticate, async (req, res) => {
  const { post_id } = req.params;
  const userId = req.user.userId;

  try {
    const check = await pool.query('SELECT * FROM posts WHERE post_id=$1 AND user_id=$2', [post_id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: '권한 없음' });

    const deleted = await pool.query('DELETE FROM posts WHERE post_id=$1 RETURNING *', [post_id]);
    res.json({ message: '삭제 성공', post: deleted.rows[0] });
  } catch (err) {
    console.error('게시글 삭제 실패:', err);
    res.status(500).json({ message: '게시글 삭제 실패' });
  }
});

module.exports = router;
