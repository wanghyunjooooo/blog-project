// routes/users.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL 연결

// ========================================
// GET /users/:id → 최신 유저 정보 조회
// ========================================
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT user_id, username, profile_img, email, created_at
       FROM users
       WHERE user_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]); // { user_id, username, profile_img, email, created_at }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// ========================================
// PATCH /users/:id → 닉네임(username) 수정
// ========================================
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET username = $1
       WHERE user_id = $2
       RETURNING user_id, username, profile_img`,
      [username, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "닉네임이 업데이트되었습니다",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

module.exports = router;
