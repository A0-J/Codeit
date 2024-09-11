import express from 'express';
import Comment from '../models/comment.js';  // Mongoose Comment 모델을 가져옵니다.

const commentsRouter = express.Router();

// 유효한 ObjectId인지 확인하는 함수
const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// 댓글 생성 및 조회
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
    })
    .get(async (req, res) => {
        try {
            const { postId } = req.params;
            const { page = 1, pageSize = 10, commentId } = req.query;

            // 페이지와 페이지 크기 변환
            const pageNumber = Number(page);
            const pageSizeNumber = Number(pageSize);

            // 필터 조건 생성
            const filterConditions = { postId };

            // commentId가 있는 경우, ObjectId로 변환하여 필터링
            if (commentId) {
                if (!isValidObjectId(commentId)) {
                    return res.status(400).json({ message: "유효하지 않은 commentId입니다" });
                }
                filterConditions._id = { $gte: new ObjectId(commentId) };  // 'new' 키워드 사용
            }

            // 전체 댓글 수 조회
            const totalItemCount = await Comment.countDocuments(filterConditions);
            const totalPages = Math.ceil(totalItemCount / pageSizeNumber);

            // 댓글 목록 조회
            const comments = await Comment.find(filterConditions)
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * pageSizeNumber)
                .limit(pageSizeNumber);

            // 응답 전송
            return res.status(200).json({
                currentPage: pageNumber,
                totalPages: totalPages,
                totalItemCount: totalItemCount,
                data: comments.map(comment => ({
                    id: comment._id,
                    nickname: comment.nickname,
                    content: comment.content,
                    createdAt: comment.createdAt
                }))
            });
        } catch (error) {
            console.error('Error fetching comments:', error);  // 에러 로그 추가
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

// 댓글 수정 요청 처리
commentsRouter.route('/comments/:commentId')
    .put(async (req, res) => {
        try {
            const { commentId } = req.params;
            const { nickname, content, password } = req.body;

            // 모든 필드 검증
            if (!nickname || !content || !password||!isValidObjectId(commentId)) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // commentId가 유효한 ObjectId인지 확인
            //if (!isValidObjectId(commentId)) {
            //    return res.status(400).json({ message: "유효하지 않은 commentId입니다" });
            //}

            // 댓글 조회
            const comment = await Comment.findOne({ _id: commentId });

            // 댓글이 존재하지 않는 경우
            if (!comment) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 비밀번호 확인
            if (comment.password !== password) {
                return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 댓글 수정
            comment.nickname = nickname;
            comment.content = content;
            await comment.save();

            // 성공적인 응답
            return res.status(200).json({
                id: comment._id,
                nickname: comment.nickname,
                content: comment.content,
                createdAt: comment.createdAt
            });
        } catch (error) {
            // 에러 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    })
    .delete(async (req, res) => {
        try {
            const { commentId } = req.params;
            const { password } = req.body;

            // password 필드 검증
            if (!password||!isValidObjectId(commentId)) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // commentId가 유효한 ObjectId인지 확인
            //if (!isValidObjectId(commentId)) {
            //    return res.status(400).json({ message: "유효하지 않은 commentId입니다" });
            //}

            // 댓글 조회
            const comment = await Comment.findOne({ _id: commentId });

            // 댓글이 존재하지 않는 경우
            if (!comment) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 비밀번호 확인
            if (comment.password !== password) {
                return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 댓글 삭제
            await Comment.deleteOne({ _id: commentId });

            // 성공적인 응답
            return res.status(200).json({ message: "답글 삭제 성공" });
        } catch (error) {
            // 에러 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

export default commentsRouter;
