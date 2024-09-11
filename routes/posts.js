import express from 'express';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import multer from 'multer';
import fs from 'fs';

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

            // 인덱스 변환 및 조회
            const index = parseInt(postId, 10);
            const posts = await Post.find().sort({ createdAt: -1 });

            // 인덱스에 해당하는 게시글 조회
            const post = posts[index];

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
            const response = {
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
            };

            return res.status(200).json(response);
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

            // 인덱스 변환 및 조회
            const index = parseInt(postId, 10);
            const posts = await Post.find().sort({ createdAt: -1 });

            // 인덱스에 해당하는 게시글 조회
            const post = posts[index];

            // 게시글이 존재하지 않는 경우
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 비밀번호가 일치하지 않는 경우
            if (post.postPassword !== postPassword) {
                return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 게시글 삭제
            await Post.findByIdAndDelete(post._id);

            // 성공적으로 삭제되었음을 알리는 응답
            return res.status(200).json({ message: "게시글 삭제 성공" });

        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    })
    .get(async (req, res) => { // 게시글 상세 정보 조회
        try {
            const { postId } = req.params;
    
            // 필수 필드 검증 및 MongoDB ObjectId 형식 확인
            if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }
    
            // postId로 게시글 조회
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

//별도로 분리된 라우팅들

postRouter.route('/posts/:postId/verify-password')
    .post(async (req, res) => { // 게시글 조회 권한 확인
        try {
            const { postId } = req.params;
            const { password } = req.body;

            // 필수 필드 검증
            if (!postId || !password) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // 인덱스 변환 및 게시글 조회
            const index = parseInt(postId, 10);
            const posts = await Post.find().sort({ createdAt: -1 });

            // 인덱스에 해당하는 게시글 조회
            const post = posts[index];

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
    
            // postId 유효성 검증 (MongoDB ObjectId 형식 체크)
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }
    
            // postId로 게시글 조회
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

            // 인덱스 변환 및 게시글 조회
            const index = parseInt(postId, 10);
            const posts = await Post.find().sort({ createdAt: -1 });

            // 인덱스에 해당하는 게시글 조회
            const post = posts[index];

            // 게시글이 존재하지 않는 경우 404 에러 반환
            if (!post) {
                return res.status(404).json({ message: "존재하지 않습니다" });
            }

            // 공개 여부를 포함한 응답 반환
            return res.status(200).json({
                id: post._id,
                isPublic: post.isPublic
            });

        } catch (error) {
            // 서버 오류 처리
            console.error('Error retrieving post visibility:', error); // 에러 로그
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    });

// 유효한 ObjectId인지 확인하는 함수
const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// 댓글 생성 및 조회
postRouter.route('/posts/:postId/comments')
    .post(async (req, res) => {
        try {
            const { nickname, content, password } = req.body;
            const { postId } = req.params; // URL 파라미터에서 postId 추출

            // 인덱스 변환 및 게시글 조회
            const index = parseInt(postId, 10);
            const posts = await Post.find().sort({ createdAt: -1 });

            // 인덱스에 해당하는 게시글 조회
            const post = posts[index];

            if (!post) {
                return res.status(404).json({ message: "해당 인덱스에 해당하는 게시글이 없습니다." });
            }

            // 모든 필드 검증
            if (!nickname || !content || !password) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // 새로운 댓글 생성 (게시글의 인덱스(postId)를 저장)
            const newComment = new Comment({
                nickname,
                content,
                password,
                postIndex: index // 댓글에 게시글의 인덱스를 저장
            });

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
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    }) //인덱스로 저장
    .get(async (req, res) => {
        try {
            const { postId } = req.params;
            const { page = 1, pageSize = 10, commentId } = req.query;

            // 인덱스 변환 및 게시글 조회
            const index = parseInt(postId, 10);
            const posts = await Post.find().sort({ createdAt: -1 });

            // 인덱스에 해당하는 게시글 조회
            const post = posts[index];

            if (!post) {
                return res.status(404).json({ message: "해당 인덱스에 해당하는 게시글이 없습니다." });
            }

            // 페이지와 페이지 크기 변환
            const pageNumber = Number(page);
            const pageSizeNumber = Number(pageSize);

            // 필터 조건 생성 (해당 게시글의 postIndex를 기반으로 댓글 조회)
            const filterConditions = { postIndex: index };

            // commentId가 있는 경우, ObjectId로 변환하여 필터링
            if (commentId) {
                if (!isValidObjectId(commentId)) {
                    return res.status(400).json({ message: "유효하지 않은 commentId입니다" });
                }
                filterConditions._id = { $gte: new ObjectId(commentId) };
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
            console.error('Error fetching comments:', error);
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    });


export default postRouter;
