// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// 환경변수 로드
dotenv.config();

// 앱 생성
const app = express();

// 미들웨어
app.use(cors());
app.use(express.json()); // JSON body 파싱

// 라우터
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const postsRouter = require('./routes/posts'); // 게시글 라우터
const commentRouter = require('./routes/comments');
const likeRouter = require('./routes/likes');
const searchRouter = require('./routes/search'); // search 별도 라우터

// ✅ 라우터 등록 순서 중요!
// 1. 검색 라우트 먼저 등록 (충돌 방지)
app.use('/posts/search', searchRouter);

// 2. 좋아요/댓글은 특정 postId 아래
app.use('/posts/:postId/likes', likeRouter);
app.use('/posts/:postId/comments', commentRouter);

// 3. 게시글 CRUD 및 특정 게시글 조회
app.use('/posts', postsRouter);

// 4. 인증/프로필
app.use('/auth', authRouter);
app.use('/users', profileRouter);

// ✅ 업로드 폴더 static 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ 프론트 정적 파일 제공 (마지막)
app.use(express.static(path.join(__dirname, '../frontend')));

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
