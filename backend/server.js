const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const authRouter = require('./routes/auth');

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 연결
app.use('/auth', authRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Blog API Server Running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
