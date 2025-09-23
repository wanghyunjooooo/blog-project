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

// 업로드 폴더를 static으로 제공 (프로필 이미지 접근용)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// frontend 정적 파일 제공
app.use(express.static(path.join(__dirname, '../frontend')));

// 라우터
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const postsRouter = require('./routes/posts'); // 게시글 라우터
// 라우트 연결
const commentRouter = require('./routes/comments');
const likeRouter = require('./routes/likes');
app.use('/posts/:postId/comments', commentRouter);
app.use('/posts/:postId/likes', likeRouter);


app.use('/auth', authRouter);
app.use('/users', profileRouter);
app.use('/posts', postsRouter); // <- 여기 수정, 이제 Postman에서 /posts로 접근 가능

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
