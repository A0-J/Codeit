import express from 'express';
import mongoose from 'mongoose';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import usersRouter from './routes/users.js';
import groupsRouter from './routes/groups.js';  // groupsRouter 추가
import imageRoutes from './routes/images.js';
import { DATABASE_URL } from './env.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// '/uploads' 경로에 정적 파일 제공 (이미지 URL 접근 가능하도록 설정)
app.use('/uploads', express.static('uploads'));


app.use('/api', postsRouter);
app.use('/api', commentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter); // '/api/groups' 경로로 groupsRouter 연결
app.use('/api/image', imageRoutes);  // 이미지 라우터를 '/api/images' 경로로 설정


app.listen(3000, () => console.log('Server Started on port 3000'));

// 데이터베이스 연결 설정
mongoose.connect(DATABASE_URL)
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('Database connection error:', err));
