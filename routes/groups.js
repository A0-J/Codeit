import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import Group from '../models/group.js';
import Post from '../models/post.js';
import Image from '../models/image.js';  // Mongoose 이미지 모델을 가져옵니다.
import { checkAndAssignBadges } from '../services/badgeService.js';  

const router = express.Router();

// Multer 설정: 파일 저장 디렉토리와 파일 이름 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/'; // 파일 업로드 경로 설정
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // 디렉토리 없으면 생성
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // 파일 이름 설정 (타임스탬프 + 원본 파일 이름)
    }
});

const upload = multer({ storage });

// 그룹 생성 API (이미지 업로드 추가)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const {
            name,
            password,
            isPublic,
            introduction,
            imageUrl // 요청에서 받은 이미지 URL
        } = req.body;

        if (!name || !password || typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }
        // 이미지 처리
        let imageUrlToSave = imageUrl; // 요청에서 받은 imageUrl을 사용
        if (req.file) {
            imageUrlToSave = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            
            // 데이터베이스에 이미지 정보 저장
            const newImage = new Image({
                filename: req.file.filename,
                url: imageUrlToSave
            });
            await newImage.save();
        }

        // 그룹 생성 로직
        const newGroup = new Group({
            name,
            password, // 실제로는 해시된 비밀번호를 저장해야 합니다.
            imageUrl: imageUrlToSave || null,  // 이미지 URL 저장
            isPublic,
            introduction: introduction || "",
            likeCount: 0,
            badges: [],
            postCount: 0,
        });

        const savedGroup = await newGroup.save();

        // 배지 확인 및 할당
        const badges = await checkAndAssignBadges(savedGroup);

        return res.status(201).json({
            id: savedGroup.Id,
            name: savedGroup.name,
            imageUrl: savedGroup.imageUrl,
            isPublic: savedGroup.isPublic,
            likeCount: savedGroup.likeCount,
            badges: savedGroup.badges,
            postCount: savedGroup.postCount,
            createdAt: savedGroup.createdAt,
            introduction: savedGroup.introduction
        });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 목록 조회 API
router.get('/', async (req, res) => {
    try {
        // 요청 파라미터 추출
        const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic } = req.query;

        // 페이지와 페이지 크기 파싱
        const pageNumber = parseInt(page, 10);
        const pageSizeNumber = parseInt(pageSize, 10);

        // 유효성 검증
        if (isNaN(pageNumber) || isNaN(pageSizeNumber)) {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }

        // 정렬 기준 설정
        let sortOption;
        switch (sortBy) {
            case 'latest':
                sortOption = { createdAt: -1 }; // 최신 순
                break;
            case 'mostPosted':
                sortOption = { postCount: -1 }; // 게시글 수 많은 순
                break;
            case 'mostLiked':
                sortOption = { likeCount: -1 }; // 공감 수 많은 순
                break;
            case 'mostBadge':
                sortOption = { badgeCount: -1 }; // 배지 수 많은 순
                break;
            default:
                return res.status(400).json({ message: "잘못된 정렬 기준입니다" });
        }

        // 필터링 조건 설정
        const query = {};
        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' }; // 대소문자 구분 없는 검색
        }
        if (isPublic) {
            query.isPublic = isPublic === 'true'; // 공개 여부 필터링
        }

        // 총 아이템 수 조회
        const totalItemCount = await Group.countDocuments(query);

        // 그룹 목록 조회
        const groups = await Group.find(query)
            .sort(sortOption)
            .skip((pageNumber - 1) * pageSizeNumber)
            .limit(pageSizeNumber);

        // 총 페이지 수 계산
        const totalPages = Math.ceil(totalItemCount / pageSizeNumber);

        // 200 OK 응답 반환
        return res.status(200).json({
            currentPage: pageNumber,
            totalPages,
            totalItemCount,
            data: groups.map(group => ({
                id: group.Id,
                name: group.name,
                imageUrl: group.imageUrl,
                isPublic: group.isPublic,
                likeCount: group.likeCount,
                badgeCount: group.badges.length,
                postCount: group.postCount,
                createdAt: group.createdAt,
                introduction: group.introduction
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 수정 API (이미지 업로드 추가)
router.put('/:groupId', upload.single('image'), async (req, res) => {
    try {
        const { groupId } = req.params;
        const {
            name,
            password,
            isPublic,
            introduction,
            imageUrl // 요청에서 받은 이미지 URL
        } = req.body;

        if (!name || !password || typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }

        const group = await Group.findOne(groupId);
        if (!group) {
            return res.status(404).json({ message: "존재하지 않는 그룹입니다" });
        }

        if (group.password !== password) {
            return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
        }

        // 이미지 처리
        let imageUrlToSave = imageUrl; // 요청에서 받은 imageUrl을 사용
        if (req.file) {
            imageUrlToSave = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            
            // 데이터베이스에 이미지 정보 저장
            const newImage = new Image({
                filename: req.file.filename,
                url: imageUrlToSave
            });
            await newImage.save();
        }

        // 그룹 정보 수정
        group.name = name;
        group.imageUrl = imageUrlToSave || group.imageUrl; // 이미지 URL 업데이트
        group.isPublic = isPublic;
        group.introduction = introduction || group.introduction;

        const updatedGroup = await group.save();

        // 배지 확인 및 할당
        const badges = await checkAndAssignBadges(updatedGroup);

        return res.status(200).json({
            id: updatedGroup.id,
            name: updatedGroup.name,
            imageUrl: updatedGroup.imageUrl,
            isPublic: updatedGroup.isPublic,
            likeCount: updatedGroup.likeCount,
            badges: badges,
            postCount: updatedGroup.postCount,
            createdAt: updatedGroup.createdAt,
            introduction: updatedGroup.introduction
        });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 삭제 API
router.delete('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { password } = req.body;

        const group = await Group.findOne(groupId);
        // 필수 필드 검증
        if (!password) {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }
        if (!group) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        if (group.password !== password) {
            return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
        }
        // 그룹 삭제
        await Group.findByIdAndDelete(groupId);

        return res.status(200).json({ message: "그룹 삭제 성공" });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 상세 정보 조회 API sadfsdfsdfasdfsdfsfdfffffffffffffffffffffffffffffffffffffff
router.get('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // groupId를 숫자로 변환
        const index = parseInt(groupId, 10);

        // 유효성 검증
        if (isNaN(index) || index < 0) {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }
        // 그룹 조회
        const group = await Group.find().skip(index).limit(1).exec();
        
        if (group.length === 0) {
            return res.status(404).json({ message: "존재하지 않는 그룹입니다" });
        }

        return res.status(200).json({
            id: group[0].Id,
            name: group[0].name,
            imageUrl: group[0].imageUrl,
            isPublic: group[0].isPublic,
            likeCount: group[0].likeCount,
            badgeCount: group[0].badges.length,
            postCount: group[0].postCount,
            createdAt: group[0].createdAt,
            introduction: group[0].introduction
        });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});
// 그룹 공개 여부 확인 API OK
router.get('/:groupId/is-public', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const group = await Group.findById(groupId);

        // 그룹이 존재하지 않는 경우
        if (!group) {
            return res.status(404).json({ message: "존재하지 않는 그룹입니다" });
        }

        // 그룹의 공개 여부에 따라 다른 메시지 반환
        if (group.isPublic) {
            return res.status(200).json({ message: "이 그룹은 공개 상태입니다", isPublic: true });
        } else {
            return res.status(200).json({ message: "이 그룹은 비공개 상태입니다", isPublic: false });
        }
    } catch (error) {
        console.error('Error checking group visibility:', error); // 에러 로그
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

router.get('/:groupId/is-public', async (req, res) => {
    try {
        const { groupId } = req.params;

        // 그룹 ID를 숫자로 변환
        const numericGroupId = parseInt(groupId, 10);

        // 숫자로 변환할 수 없는 경우
        if (isNaN(numericGroupId)) {
            return res.status(400).json({ message: "잘못된 그룹 ID입니다" });
        }

        // 숫자형 ID로 그룹 조회
        const group = await Group.findOne({ Id: numericGroupId });

        // 그룹이 존재하지 않는 경우
        if (!group) {
            return res.status(404).json({ message: "존재하지 않는 그룹입니다" });
        }

        // 그룹의 공개 여부에 따라 응답
        if (group.isPublic) {
            return res.status(200).json({ message: "이 그룹은 공개 상태입니다", isPublic: true });
        } else {
            return res.status(200).json({ message: "이 그룹은 비공개 상태입니다", isPublic: false });
        }
    } catch (error) {
        console.error('Error checking group visibility:', error); // 에러 로그
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
    }
});



// 그룹 공감하기 API
router.post('/:groupId/like', async (req, res) => {
    try {
        const { groupId } = req.params;
        // groupId를 숫자로 변환
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        // 공감 수 증가
        group.likeCount += 1;

        await group.save();

        return res.status(200).json({ message: "그룹 공감하기 성공" });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 게시글 작성 API
router.post('/:groupId/posts', upload.single('image'), async (req, res) => {
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

        // 요청 파라미터 검증
        if (!nickname || !title || !content || !postPassword || !groupPassword || !groupId) {
            return res.status(400).json({ message: "잘못된 요청입니다. 필수 파라미터가 누락되었습니다." });
        }

        let group;
        try {
            const group = await Group.findById(groupId);
        } catch (groupError) {
            console.error('Error retrieving groups:', groupError);
            return res.status(500).json({ message: "그룹 조회 중 오류 발생", error: groupError.message });
        }

        // 그룹 ID 검증
        if (!group) {
            return res.status(404).json({ message: "해당 그룹을 찾을 수 없습니다" });
        }

        // 파일 업로드 처리
        let imageUrl = '';
        if (req.file) {
            try {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            } catch (fileError) {
                console.error('Error processing file:', fileError);
                return res.status(500).json({ message: "파일 처리 중 오류 발생", error: fileError.message });
            }
        }

        let savedPost;
        try {
            // 새 게시글 생성
            const newPost = new Post({
                groupId: group._id.toString(),  // 그룹 ID를 문자열로 저장
                nickname,
                title,
                content,
                postPassword,
                groupPassword,
                imageUrl,
                tags: tags || [],
                location: location || '',
                moment: moment ? new Date(moment) : new Date(),
                isPublic,
                likeCount: 0,
                commentCount: 0,
            });

            // 게시글 저장
            savedPost = await newPost.save();
        } catch (postError) {
            console.error('Error saving post:', postError);
            return res.status(500).json({ message: "게시글 저장 중 오류 발생", error: postError.message });
        }

        // 200 OK 응답 반환
        return res.status(200).json({
            id: savedPost._id.toString(),  // _id를 문자열로 변환
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
        console.error('Unexpected error creating post:', error);
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
    }
});

// 게시글 목록 조회 API
router.get('/:groupId/posts', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic = 'true' } = req.query;

        const pageNumber = Number(page);
        const pageSizeNumber = Number(pageSize);
        const isPublicBoolean = isPublic === 'true';

        // 요청 파라미터 유효성 검사
        if (isNaN(pageNumber) || isNaN(pageSizeNumber)) {
            console.error('Invalid request parameters:', { pageNumber, pageSizeNumber });
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }

        // 그룹 인덱스 변환
        const index = parseInt(groupId, 10);

        // 그룹 검증
        let group;
        try {
            const group = await Group.findById(groupId);
        
            if (!group) {
                console.error('Group not found for ID:', groupId);
                return res.status(404).json({ message: "해당 그룹을 찾을 수 없습니다" });
            }
        } catch (groupError) {
            console.error('Error retrieving groups:', groupError);
            return res.status(500).json({ message: "그룹 조회 중 오류 발생", error: groupError.message });
        }

        // 필터링 조건 설정
        const filterConditions = {
            groupId: group._id.toString(), // 그룹 ID를 문자열로 저장
            isPublic: isPublicBoolean
        };

        if (keyword) {
            filterConditions.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { content: { $regex: keyword, $options: 'i' } }
            ];
        }

        // 정렬 설정
        const sortOptions = sortBy === 'latest' ? { createdAt: -1 } : { createdAt: 1 };

        // 게시글 목록 조회
        const posts = await Post.find(filterConditions)
            .sort(sortOptions)
            .skip((pageNumber - 1) * pageSizeNumber)
            .limit(pageSizeNumber);

        return res.status(200).json({
            posts: posts.map(post => ({
                id: post._id.toString(),  // _id를 문자열로 변환
                nickname: post.nickname,
                title: post.title,
                content: post.content,
                imageUrl: post.imageUrl,
                tags: post.tags,
                location: post.location,
                moment: post.moment.toISOString().split('T')[0],
                isPublic: post.isPublic,
                likeCount: post.likeCount,
                commentCount: post.commentCount,
                createdAt: post.createdAt.toISOString(),
            })),
            totalPosts: await Post.countDocuments(filterConditions),
        });
    } catch (error) {
        console.error('Unexpected error fetching posts:', error);
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
    }
});
export default router;
