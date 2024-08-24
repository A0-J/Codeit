import express from 'express';
import mongoose from 'mongoose';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import usersRouter from './routes/users.js';
import groupsRouter from './routes/groups.js';
import imageRoutes from './routes/images.js';
import dotenv from 'dotenv';

// .env 파일에서 환경 변수 로드
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api', postsRouter);
app.use('/api', commentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/image', imageRoutes);

app.listen(3000, () => console.log('Server Started on port 3000'));

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('Database connection error:', err));

