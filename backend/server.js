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

app.use('/auth', authRouter);
app.use('/users', profileRouter);

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
