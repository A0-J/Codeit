import express from 'express';
import Comment from '../models/comment.js';  // Mongoose Comment 모델을 가져옵니다.
const commentsRouter = express.Router();

commentsRouter.route('/posts/:postId/comments')
    .post(async (req, res) => {
        try {
            const { nickname, content, password } = req.body;
            const { postId } = req.params; // URL 파라미터에서 postId 추출

            // 모든 필드 검증
            if (!nickname || !content || !password || !postId) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // 새로운 댓글 생성
            const newComment = new Comment({ nickname, content, password, postId });

            // 댓글 저장
            await newComment.save();

            // 성공적인 응답
            return res.status(200).json({
                id: newComment._id,
                nickname: newComment.nickname,
                content: newComment.content,
                createdAt: newComment.createdAt
            });
        } catch (error) {
            // 에러 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

export default commentsRouter;
