import mongoose from 'mongoose';
import Post from './models/post.js';  // Post 모델을 임포트합니다.
import Comment from './models/comment.js';  // Comment 모델을 임포트합니다.
import posts from './data/posts.js';  // 포스트 시드 데이터를 임포트합니다.
import comments from './data/comments.js';  // 댓글 시드 데이터를 임포트합니다.
import { DATABASE_URL } from './env.js';  // 데이터베이스 URL을 임포트합니다.

mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to the database.');

        // 기존의 Post와 Comment 컬렉션 데이터를 모두 삭제합니다.
        await Post.deleteMany({});
        await Comment.deleteMany({});
        console.log('Old posts and comments removed.');

        // 시드 데이터를 추가합니다.
        const insertedPosts = await Post.insertMany(posts);
        console.log('Posts seed data added.');
        console.log('Inserted Posts:', insertedPosts);

        // 포스트 ID와 댓글 데이터를 연결하여 시드합니다.
        const postIdMap = {};
        insertedPosts.forEach(post => {
            postIdMap[post.title] = post._id;  // 포스트의 제목을 키로 사용하여 ID를 매핑
        });

        // 댓글 데이터를 포스트 ID와 연결하여 시딩합니다.
        const updatedComments = comments.map(comment => ({
            ...comment,
            postId: postIdMap[comment.postTitle]  // 댓글의 제목으로 포스트 ID를 찾습니다.
        }));

        const insertedComments = await Comment.insertMany(updatedComments);
        console.log('Comments seed data added.');
        console.log('Inserted Comments:', insertedComments);

        mongoose.disconnect();  // 데이터베이스 연결을 종료합니다.
        console.log('Disconnected from the database.');
    })
    .catch(error => {
        console.error('Error connecting to the database:', error);
    });
