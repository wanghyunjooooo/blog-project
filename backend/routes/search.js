const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticate = require("../middleware/authenticate");

// 🔍 게시글 검색
router.get("/", authenticate, async (req, res) => {
  const { keyword } = req.query;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        u.username AS author_name,
        COALESCE(likes_count.count, 0) AS like_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END AS is_liked
      FROM Posts p
      LEFT JOIN Users u ON p.user_id = u.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS count
        FROM Likes
        GROUP BY post_id
      ) AS likes_count ON likes_count.post_id = p.post_id
      LEFT JOIN Likes ul ON ul.post_id = p.post_id AND ul.user_id = $2
      WHERE p.title ILIKE $1 OR p.content ILIKE $1
      ORDER BY p.created_at DESC
      `,
      [`%${keyword}%`, userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("검색 API 오류:", err);
    res.status(500).json({ error: "검색 실패" });
  }
});

module.exports = router;
