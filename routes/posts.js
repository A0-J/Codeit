import express from 'express';
import Post from '../models/post.js';  // Mongoose Post 모델을 가져옵니다.
const postRouter = express.Router();

postRouter.route('/groups/:groupId/posts')
    .post(async (req, res) => {  // 게시글 등록 API
        try {
            const {
                nickname,
                title,
                content,
                postPassword,
                groupPassword,
                imageUrl,
                tags,
                location,
                moment,
                isPublic
            } = req.body;

            const { groupId } = req.params;

            // 필수 필드가 누락된 경우 400 에러 반환
            if (!nickname || !title || !content || !postPassword || !groupPassword || !groupId) {
                return res.status(400).json({ message: "잘못된 요청입니다" });
            }

            // 게시글을 Mongoose 모델로 생성하여 저장
            const newPost = new Post({
                groupId: Number(groupId),
                nickname,
                title,
                content,
                postPassword,
                groupPassword,
                imageUrl,
                tags,
                location,
                moment,
                isPublic,
                likeCount: 0,
                commentCount: 0,
            });

            await newPost.save();

            // 성공적으로 생성되었음을 나타내는 200 응답
            return res.status(200).json(newPost);
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
            const groupIdNumber = Number(groupId);
            const isPublicBoolean = isPublic === 'true';

            // 요청 파라미터 유효성 검사
            if (isNaN(pageNumber) || isNaN(pageSizeNumber) || isNaN(groupIdNumber)) {
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

            return res.status(200).json({
                currentPage: pageNumber,
                totalPages: totalPages,
                totalItemCount: totalItemCount,
                data: posts
            });
        } catch (error) {
            return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
        }
    });

export default postRouter;
