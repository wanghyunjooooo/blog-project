// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');

// 업로드 폴더 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // 업로드 폴더
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // 파일명 중복 방지
  }
});

const upload = multer({ storage });

// ✅ 게시글 전체 조회 (작성자 이름 포함)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username AS author_name
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

// ✅ 특정 게시글 조회 (작성자 이름 포함)
router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.*, u.username AS author_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = $1
    `, [post_id]);

    if (result.rows.length === 0) return res.status(404).send('Post not found');

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ✅ 게시글 작성 (이미지 업로드 포함, 작성자 이름 포함 반환)
router.post('/', upload.single('image'), async (req, res) => {
  const { user_id, title, content } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // 게시글 삽입
    const insertResult = await pool.query(
      'INSERT INTO posts (user_id, title, content, image_url, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [user_id, title, content, image_url]
    );

    const post_id = insertResult.rows[0].post_id;

    // 작성자 이름 포함해서 반환
    const postWithAuthor = await pool.query(`
      SELECT p.*, u.username AS author_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = $1
    `, [post_id]);

    res.json(postWithAuthor.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ✅ 게시글 수정
router.put('/:post_id', upload.single('image'), async (req, res) => {
  const { post_id } = req.params;
  const { title, content } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'UPDATE posts SET title=$1, content=$2, image_url=COALESCE($3, image_url), updated_at=NOW() WHERE post_id=$4 RETURNING *',
      [title, content, image_url, post_id]
    );
    if (result.rows.length === 0) return res.status(404).send('Post not found');

    // 수정 후 작성자 이름 포함해서 반환
    const postWithAuthor = await pool.query(`
      SELECT p.*, u.username AS author_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = $1
    `, [post_id]);

    res.json(postWithAuthor.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ✅ 게시글 삭제
router.delete('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM posts WHERE post_id=$1 RETURNING *', [post_id]);
    if (result.rows.length === 0) return res.status(404).send('Post not found');

    res.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
