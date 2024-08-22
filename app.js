// app.js
import express from 'express';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';

const app = express();
app.use(express.json()); // JSON 파싱 미들웨어 추가
app.use(express.urlencoded({extended: true}));  //배열 데이터 받아오는 설정

// '/api' 경로에 postsRouter 연결
app.use('/api', postsRouter);
app.use('/api', commentsRouter);


app.listen(3000, () => console.log('Server Started on port 3000'));

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));