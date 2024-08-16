// app.js
import express from 'express';
import postsRouter from './routes/posts.js';

const app = express();
app.use(express.json()); // JSON 파싱 미들웨어 추가

// '/api' 경로에 postsRouter 연결
app.use('/api', postsRouter);

app.listen(3000, () => console.log('Server Started on port 3000'));
