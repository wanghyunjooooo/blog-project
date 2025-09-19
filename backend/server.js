require('dotenv').config(); // .env 로드
const express = require('express');
const path = require('path');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 정적 파일 제공 (프론트)
app.use(express.static(path.join(__dirname, '../frontend')));

// 업로드 폴더 접근 허용
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우트
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
