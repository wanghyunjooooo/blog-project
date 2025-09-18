const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const cors = require('cors');
const authRouter = require('./routes/auth');

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 허용 (Go Live에서 테스트할 때 필요)
app.use(cors());

// 프론트 정적 파일 제공
app.use(express.static(path.join(__dirname, '../frontend')));

// 라우트 연결
app.use('/auth', authRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
