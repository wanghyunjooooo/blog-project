const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

// 🔹 유저 알림 조회
router.get('/', authenticate, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT notification_id, user_id, type, message, post_id, actor_name, post_title, comment, is_read, created_at
             FROM Notifications 
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

// 🔹 새로운 알림 생성 (좋아요/댓글용)
router.post('/', async (req, res) => {
    const { user_id, type, post_id, actor_name, post_title, comment } = req.body;

    if (!user_id || !type) {
        return res.status(400).json({ message: 'user_id, type 필요' });
    }

    // 기본 메시지 자동 생성
    let message = '';
    if (type === '좋아요') {
        message = `${actor_name || '누군가'}님이 "${post_title || '게시글'}" 글을 좋아합니다.`;
    } else if (type === '댓글') {
        message = `${actor_name || '누군가'}님이 "${post_title || '게시글'}" 글에 댓글: "${comment || ''}"`;
    } else {
        message = '새 알림이 도착했습니다.';
    }

    try {
        const result = await pool.query(
            `INSERT INTO Notifications 
            (user_id, type, message, post_id, actor_name, post_title, comment)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [user_id, type, message, post_id || null, actor_name || null, post_title || null, comment || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('알림 생성 오류:', err);
        res.status(500).json({ error: '알림 생성 실패' });
    }
});

module.exports = router;
