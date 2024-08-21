import mongoose from 'mongoose';
import Post from './models/post.js';  // Post 모델을 임포트합니다.
import posts from './data/mock.js';  // 시드 데이터를 임포트합니다.
import { DATABASE_URL } from './env.js';  // 데이터베이스 URL을 임포트합니다.

mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to the database.');

        // 기존의 Post 컬렉션 데이터를 모두 삭제합니다.
        await Post.deleteMany({});
        console.log('Old posts removed.');

        // 시드 데이터를 추가합니다.
        await Post.insertMany(posts);
        console.log('Seed data added.');

        mongoose.disconnect();  // 데이터베이스 연결을 종료합니다.
        console.log('Disconnected from the database.');
    })
    .catch(error => {
        console.error('Error connecting to the database:', error);
    });
