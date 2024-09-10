import express from 'express';
import Post from '../models/post.js';
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

// 게시글 작성 API
postRouter.route('/groups/:groupId/posts')
    .post(upload.single('image'), async (req, res) => {
        try {
            const {
                nickname,
                title,
                content,
                postPassword,
                groupPassword,
                tags,
                location,
                moment,
                isPublic
            } = req.body;

            const { groupId } = req.params;

            if (!nickname || !title || !content || !postPassword || !groupPassword || !groupId) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            let imageUrl = '';
            if (req.file) {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            }

            const newPost = new Post({
                groupId: groupId, // No conversion to Number, assuming groupId is a string
                nickname,
                title,
                content,
                postPassword,
                groupPassword,
                imageUrl: imageUrl || '',
                tags: tags || [],
                location: location || '',
                moment: moment ? new Date(moment) : new Date(),
                isPublic,
                likeCount: 0,
                commentCount: 0,
            });

            const savedPost = await newPost.save();

            return res.status(200).json({
                id: savedPost._id,
                groupId: savedPost.groupId,
                nickname: savedPost.nickname,
                title: savedPost.title,
                content: savedPost.content,
                imageUrl: savedPost.imageUrl,
                tags: savedPost.tags,
                location: savedPost.location,
                moment: savedPost.moment.toISOString().split('T')[0],
                isPublic: savedPost.isPublic,
                likeCount: savedPost.likeCount,
                commentCount: savedPost.commentCount,
                createdAt: savedPost.createdAt.toISOString(),
            });
        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    })
    .get(async (req, res) => {  // 게시글 목록 조회 API
        try {
            const { groupId } = req.params;
            const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic = 'true' } = req.query;

            const pageNumber = Number(page);
            const pageSizeNumber = Number(pageSize);
            const groupIdNumber = groupId;
            const isPublicBoolean = isPublic === 'true';

            // 요청 파라미터 유효성 검사
            if (isNaN(pageNumber) || isNaN(pageSizeNumber) || groupIdNumber) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }
            // 필터링 조건
            const filterConditions = {
                groupId: groupIdNumber,
                isPublic: isPublicBoolean,
                title: new RegExp(keyword, 'i')  // 대소문자 구분 없이 검색
            };

            // 정렬 조건
            let sortConditions;
            if (sortBy === 'latest') {
                sortConditions = { createdAt: -1 };
            } else if (sortBy === 'mostCommented') {
                sortConditions = { commentCount: -1 };
            } else if (sortBy === 'mostLiked') {
                sortConditions = { likeCount: -1 };
            }

            // 게시글 목록 조회
            const totalItemCount = await Post.countDocuments(filterConditions);
            const totalPages = Math.ceil(totalItemCount / pageSizeNumber);
            const posts = await Post.find(filterConditions)
                .sort(sortConditions)
                .skip((pageNumber - 1) * pageSizeNumber)
                .limit(pageSizeNumber);

            // 데이터 변환
            const formattedPosts = posts.map(post => ({
                id: post._id,
                name: post.title,  // assuming 'title' is used as 'name' here
                imageUrl: post.imageUrl || '',  // assuming there's an 'imageUrl' field
                isPublic: post.isPublic,
                likeCount: post.likeCount,
                badgeCount: post.badgeCount || 0,  // defaulting to 0 if not present
                postCount: post.postCount || 0,    // defaulting to 0 if not present
                createdAt: post.createdAt.toISOString(),
                introduction: post.introduction || ''  // defaulting to empty string if not present
            }));

            return res.status(200).json({
                currentPage: pageNumber,
                totalPages: totalPages,
                totalItemCount: totalItemCount,
                data: formattedPosts
            });
        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

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

            // 게시글 찾기
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
            post.moment = moment;
            post.isPublic = isPublic;

            // 업데이트된 게시글 저장
            await post.save();

            // 성공적으로 수정되었음을 나타내는 200 응답
            // 응답 형식 맞추기
            const response = {
                id: post._id,  // Assuming `post._id` is the unique ID of the post
                groupId: post.groupId || null,  // Assuming `groupId` is part of the post schema
                nickname: post.nickname,
                title: post.title,
                content: post.content,
                imageUrl: post.imageUrl,
                tags: post.tags,
                location: post.location,
                moment: post.moment,
                isPublic: post.isPublic,
                likeCount: post.likeCount || 0,  // Assuming `likeCount` is part of the post schema
                commentCount: post.commentCount || 0,  // Assuming `commentCount` is part of the post schema
                createdAt: post.createdAt  // Assuming `createdAt` is part of the post schema
            };

            return res.status(200).json(response);
        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
        }
    })
    .delete(async (req, res) => { //게시글 삭제
        try {
            const { postId } = req.params;
            const { postPassword } = req.body;
    
            // 필수 필드 검증
            if (!postId || !postPassword) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }
    
            // 해당 게시글을 데이터베이스에서 찾습니다.
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
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    })
    .get(async (req, res) => { //게시글 상세 정보 조회
        try {
            const { postId } = req.params;

            // 필수 필드 검증
            if (!postId || !mongoose.Types.ObjectId.isValid(postId))  {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // 게시글 찾기
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
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });


//별도로 분리된 라우팅들

//게시글 조회 권한 확인하기
    postRouter.route('/posts/:postId/verify-password')
    .post(async (req, res) => {
        try {
            const { postId } = req.params;
            const { password } = req.body;

            // 필수 필드 검증

            // 게시글 찾기
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우 404 에러 반환

            // 비밀번호가 일치하지 않는 경우 401 에러 반환
            if (post.postPassword !== password) {
                return res.status(401).json({ message: "비밀번호가 틀렸습니다" });
            }

            // 비밀번호가 맞는 경우 200 응답
            return res.status(200).json({ message: "비밀번호가 확인되었습니다" });

        } catch (error) {
            // 서버 오류 처리
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });
//게시글 공감하기
    postRouter.route('/posts/:postId/like')
    .post(async (req, res) => {
        try {
            const { postId } = req.params;

            // 게시글 찾기
            const post = await Post.findById(postId);

            // 게시글이 존재하지 않는 경우 404 에러 반환
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
            // 서버 오류 처리-잘못된 형식의 게시글 ID,...
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });
// 게시글 공개 여부 확인
    postRouter.route('/posts/:postId/is-public')
    .get(async (req, res) => {
        try {
            const { postId } = req.params;

            // 게시글 찾기
            const post = await Post.findById(postId);

            // 공개 여부를 포함한 응답 반환
            return res.status(200).json({
                id: post._id,
                isPublic: post.isPublic
            });

        } catch (error) {
            // 서버 오류 처리
            console.error('Error retrieving post visibility:', error); // 에러 로그
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

export default postRouter;
