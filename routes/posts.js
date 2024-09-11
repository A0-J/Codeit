import express from 'express';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import multer from 'multer';
import fs from 'fs';
import mongoose from 'mongoose';

const postRouter = express.Router();

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// 게시글 수정 및 삭제, 상세 정보 조회
postRouter.route('/posts/:postId')
    .put(async (req, res) => {  // 게시글 수정
        try {
            const { postId } = req.params;
            const {
                nickname,
                title,
                content,
                postPassword,
                imageUrl,
                tags,
                location,
                moment,
                isPublic
            } = req.body;

            // 필수 필드가 누락된 경우 400 에러 반환
            if (!nickname || !title || !content || !postPassword) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // ObjectId 유효성 검사
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "유효하지 않은 postId입니다" });
            }

            // ObjectId로 게시글 조회
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우 404 에러 반환
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 비밀번호가 일치하지 않는 경우 403 에러 반환
            if (post.postPassword !== postPassword) {
                return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 게시글 정보 업데이트
            post.nickname = nickname;
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            post.tags = tags;
            post.location = location;
            post.moment = moment ? new Date(moment) : post.moment;
            post.isPublic = isPublic;

            // 업데이트된 게시글 저장
            await post.save();

            // 성공적으로 수정되었음을 나타내는 200 응답
            return res.status(200).json({
                id: post._id,
                groupId: post.groupId || null,
                nickname: post.nickname,
                title: post.title,
                content: post.content,
                imageUrl: post.imageUrl,
                tags: post.tags,
                location: post.location,
                moment: post.moment,
                isPublic: post.isPublic,
                likeCount: post.likeCount || 0,
                commentCount: post.commentCount || 0,
                createdAt: post.createdAt
            });
        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    })
    .delete(async (req, res) => { // 게시글 삭제
        try {
            const { postId } = req.params;
            const { postPassword } = req.body;

            // 필수 필드 검증
            if (!postId || !postPassword) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // ObjectId 유효성 검사
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "유효하지 않은 postId입니다" });
            }

            // ObjectId로 게시글 조회
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 비밀번호가 일치하지 않는 경우
            if (post.postPassword !== postPassword) {
                return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 게시글 삭제
            await Post.findByIdAndDelete(postId);

            // 성공적으로 삭제되었음을 알리는 응답
            return res.status(200).json({ message: "게시글 삭제 성공" });

        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    })
    .get(async (req, res) => { // 게시글 상세 정보 조회
        try {
            const { postId } = req.params;

            // ObjectId 유효성 검사
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "유효하지 않은 postId입니다" });
            }

            // ObjectId로 게시글 조회
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 게시글 정보 반환
            return res.status(200).json({
                id: post._id,
                groupId: post.groupId,
                nickname: post.nickname,
                title: post.title,
                content: post.content,
                imageUrl: post.imageUrl,
                tags: post.tags,
                location: post.location,
                moment: post.moment,
                isPublic: post.isPublic,
                likeCount: post.likeCount,
                commentCount: post.commentCount,
                createdAt: post.createdAt,
            });
        } catch (error) {
            console.error('Error retrieving post:', error);
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

// 별도로 분리된 라우팅들

postRouter.route('/posts/:postId/verify-password')
    .post(async (req, res) => { // 게시글 조회 권한 확인
        try {
            const { postId } = req.params;
            const { password } = req.body;

            // 필수 필드 검증
            if (!postId || !password) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // ObjectId 유효성 검사
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "유효하지 않은 postId입니다" });
            }

            // ObjectId로 게시글 조회
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우 404 에러 반환
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 비밀번호가 일치하지 않는 경우 401 에러 반환
            if (post.postPassword !== password) {
                return res.status(401).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 비밀번호가 맞는 경우 200 응답
            return res.status(200).json({ message: "비밀번호가 확인되었습니다" });

        } catch (error) {
            // 서버 오류 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    });

postRouter.post('/posts/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;

        // ObjectId 유효성 검증
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "유효하지 않은 postId입니다" });
        }

        // ObjectId로 게시글 조회
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        // 게시글의 likeCount를 1 증가시킵니다.
        post.likeCount += 1;

        // 업데이트된 게시글을 저장합니다.
        await post.save();

        // 성공적으로 공감이 추가되었음을 나타내는 응답
        return res.status(200).json({ message: "게시글 공감하기 성공" });

    } catch (error) {
        // 서버 오류 처리
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
    }
});

postRouter.route('/posts/:postId/is-public')
    .get(async (req, res) => { // 게시글 공개 여부 확인
        try {
            const { postId } = req.params;

            // ObjectId 유효성 검사
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "유효하지 않은 postId입니다" });
            }

            // ObjectId로 게시글 조회
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우 404 에러 반환
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 공개 여부 반환
            return res.status(200).json({ isPublic: post.isPublic });

        } catch (error) {
            // 서버 오류 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    });

postRouter.route('/posts/:postId/comments')
    .get(async (req, res) => { // 댓글 조회
        try {
            const { postId } = req.params;

            // ObjectId 유효성 검사
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "유효하지 않은 postId입니다" });
            }

            // ObjectId로 게시글 조회
            const post = await Post.findById(postId).populate('comments');

            // 게시글이 존재하지 않는 경우
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 댓글 정보를 반환합니다.
            return res.status(200).json(post.comments);

        } catch (error) {
            // 서버 오류 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    });

export default postRouter;

