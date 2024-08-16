// routes/posts.js
import express from 'express';

const postRouter = express.Router();

// 임시 데이터 저장소
let posts = [];
let postIdCounter = 1;

postRouter.route('/groups/:groupId/posts')
    .post((req,res)=>{ // 게시글 등록 API
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
    
        const { groupId } = req.params; // groupId는 URL 파라미터로 가져옵니다.
    
        // 필수 필드가 누락된 경우 400 에러 반환
        if (!nickname || !title || !content || !postPassword || !groupPassword || !groupId) {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }
    
        // 게시글을 저장하는 로직
        const newPost = {
            id: postIdCounter++,
            groupId: Number(groupId),
            nickname,
            title,
            content,
            imageUrl,
            tags,
            location,
            moment,
            isPublic,
            likeCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString(),
        };
    
        posts.push(newPost);
    
        // 성공적으로 생성되었음을 나타내는 200 응답
        return res.status(200).json(newPost);
    })
    .get((req, res) => {
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
    
        // 필터링
        let filteredPosts = posts.filter(post => 
            post.groupId === groupIdNumber &&
            post.title.includes(keyword) &&
            post.isPublic === isPublicBoolean
        );
    
        // 정렬
        if (sortBy === 'latest') {
            filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'mostCommented') {
            filteredPosts.sort((a, b) => b.commentCount - a.commentCount);
        } else if (sortBy === 'mostLiked') {
            filteredPosts.sort((a, b) => b.likeCount - a.likeCount);
        }
    
        // 페이징
        const totalItemCount = filteredPosts.length;
        const totalPages = Math.ceil(totalItemCount / pageSizeNumber);
        const pagedPosts = filteredPosts.slice((pageNumber - 1) * pageSizeNumber, pageNumber * pageSizeNumber);
    
        return res.status(200).json({
            currentPage: pageNumber,
            totalPages: totalPages,
            totalItemCount: totalItemCount,
            data: pagedPosts
        });
    });


export default postRouter;
