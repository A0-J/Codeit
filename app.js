import express from 'express';
import mongoose from 'mongoose';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import groupsRouter from './routes/groups.js';
import imageRoutes from './routes/images.js';
import dotenv from 'dotenv';
import cors from 'cors'; // CORS 패키지 추가

// .env 파일에서 환경 변수 로드
dotenv.config();

const app = express();

// CORS 설정
app.use(cors({
  origin: '*', // 허용할 프론트엔드 URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/', postsRouter);
app.use('/', commentsRouter);
app.use('/groups', groupsRouter);
app.use('/image', imageRoutes);

app.listen(3000, () => console.log('Server Started on port 3000'));

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('Database connection error:', err));
