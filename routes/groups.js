import express from 'express';
import mongoose from 'mongoose';
import Group from '../models/group.js';  // Mongoose Group 모델을 가져옵니다.

const router = express.Router();

// 그룹 등록 API
router.post('/', async (req, res) => {
    try {
        const {
            name,
            password,
            imageUrl,
            isPublic,
            introduction
        } = req.body;

        // 필수 필드가 누락된 경우 400 에러 반환
        if (!name || !password || typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }

        // 그룹 생성 로직
        const newGroup = new Group({
            name,
            password, // 실제로는 해시된 비밀번호를 저장해야 합니다.
            imageUrl: imageUrl || null,
            isPublic,
            introduction: introduction || "",
        });

        await newGroup.save();

        // 201 Created 응답 반환
        return res.status(201).json(newGroup);
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 수정 API
router.put('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const {
            name,
            password,
            imageUrl,
            isPublic,
            introduction
        } = req.body;

        // 필수 필드가 누락된 경우 400 에러 반환
        if (!name || !password || typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        if (group.password !== password) {
            return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
        }

        // 그룹 정보 수정
        group.name = name;
        group.imageUrl = imageUrl || group.imageUrl;
        group.isPublic = isPublic;
        group.introduction = introduction || group.introduction;

        await group.save();

        return res.status(200).json(group);
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 삭제 API
router.delete('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { password } = req.body;

        const group = await Group.findById(groupId);

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

// 그룹 상세 정보 조회 API
router.get('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;

        // groupId를 ObjectId로 변환
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "잘못된 요청입니다" });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        return res.status(200).json({
            id: group._id,
            name: group.name,
            imageUrl: group.imageUrl,
            isPublic: group.isPublic,
            likeCount: group.likeCount,
            badgeCount: group.badges.length,  // badges 배열의 길이로 badgeCount 계산
            postCount: group.postCount,
            createdAt: group.createdAt,
            introduction: group.introduction
        });
    } catch (error) {
        console.error('Error retrieving group details:', error); // 에러 로그
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 조회 권한 확인 (비밀번호 확인) API
router.post('/:groupId/verify-password', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { password } = req.body;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        if (group.password !== password) {
            return res.status(401).json({ message: "비밀번호가 틀렸습니다" });
        }

        return res.status(200).json({ message: "비밀번호가 확인되었습니다" });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

// 그룹 공감하기 API
router.post('/:groupId/like', async (req, res) => {
    try {
        const { groupId } = req.params;

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

// 그룹 공개 여부 확인 API
router.get('/:groupId/public-status', async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "존재하지 않습니다" });
        }

        return res.status(200).json({ id: group.id, isPublic: group.isPublic });
    } catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

export default router;

