const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/authenticate');

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --------------------
// ✅ 내 글만 조회 (마이페이지)
router.get('/my-posts', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.user_id=$1
      ORDER BY p.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// --------------------
// ✅ 게시글 삭제 (본인 글만)
router.delete('/:post_id', authenticate, async (req, res) => {
  const { post_id } = req.params;
  const userId = req.user.userId;

  try {
    const check = await pool.query('SELECT * FROM posts WHERE post_id=$1 AND user_id=$2', [post_id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: '권한 없음' });

    const result = await pool.query('DELETE FROM posts WHERE post_id=$1 RETURNING *', [post_id]);
    res.json({ message: '삭제 성공', post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// --------------------
// ✅ 게시글 수정 (본인 글만)
router.put('/:post_id', authenticate, upload.single('image'), async (req, res) => {
  const { post_id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.userId;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // 본인 글 여부 확인
    const check = await pool.query('SELECT * FROM posts WHERE post_id=$1 AND user_id=$2', [post_id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: '권한 없음' });

    // 수정
    await pool.query(
      'UPDATE posts SET title=$1, content=$2, image_url=COALESCE($3, image_url), updated_at=NOW() WHERE post_id=$4',
      [title, content, image_url, post_id]
    );

    // 작성자 포함해서 반환
    const postWithAuthor = await pool.query(`
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id=$1
    `, [post_id]);

    res.json(postWithAuthor.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// --------------------
// 게시글 전체 조회
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 특정 게시글 조회
router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id=$1
    `, [post_id]);

    if (result.rows.length === 0) return res.status(404).send('Post not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// --------------------
// ✅ 게시글 작성 (로그인 사용자 기준)
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

    const postWithAuthor = await pool.query(`
      SELECT p.*, u.username AS author_name, u.profile_img AS author_profile
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id=$1
    `, [post_id]);

    res.json(postWithAuthor.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
