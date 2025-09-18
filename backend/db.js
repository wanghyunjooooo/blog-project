const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL 연결
const pool = new Pool({
  user: 'hjwang',                 // DB 아이디
  host: '221.148.75.44',          // DB IP
  database: 'hjwang_db',           // DB 이름
  password: 'reinno@1583',        // DB 비밀번호
  port: 5432                       // 포트
});

module.exports = pool;