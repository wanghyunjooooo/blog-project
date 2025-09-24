const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

// 🔹 유저 알림 조회
router.get('/', authenticate, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT * FROM Notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('알림 조회 오류:', err);
        res.status(500).json({ error: '알림 조회 실패' });
    }
});

// 🔹 특정 알림 읽음 처리
router.patch('/:id/read', authenticate, async (req, res) => {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    try {
        const result = await pool.query(
            `UPDATE Notifications
             SET is_read = TRUE
             WHERE notification_id = $1 AND user_id = $2
             RETURNING *`,
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('알림 읽음 처리 오류:', err);
        res.status(500).json({ error: '알림 읽음 처리 실패' });
    }
});

// 🔹 새로운 알림 생성 (post_id 포함 가능)
router.post('/', async (req, res) => {
    const { user_id, type, message, post_id } = req.body;

    if (!user_id || !type || !message) {
        return res.status(400).json({ message: 'user_id, type, message 필요' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO Notifications (user_id, type, message, post_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [user_id, type, message, post_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('알림 생성 오류:', err);
        res.status(500).json({ error: '알림 생성 실패' });
    }
});

module.exports = router;
