import express from 'express';
import mongoose from 'mongoose';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import usersRouter from './routes/users.js';
import { DATABASE_URL } from './env.js';

const app = express();
app.use(express.json()); // JSON 파싱 미들웨어
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 처리

app.use('/api', postsRouter);
app.use('/api', commentsRouter);
app.use('/api/users', usersRouter);

app.listen(3000, () => console.log('Server Started on port 3000'));

mongoose.connect(DATABASE_URL)
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('Database connection error:', err));
