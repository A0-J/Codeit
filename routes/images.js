import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Image from '../models/image.js';  // Mongoose Image 모델을 가져옵니다.

const router = express.Router();

// 저장할 디렉토리 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = '../uploads/';
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

// 이미지 업로드 및 URL 생성 API
router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "이미지가 없습니다" });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    try {
        // 데이터베이스에 이미지 정보 저장
        const newImage = new Image({
            filename: req.file.filename,
            url: imageUrl
        });

        await newImage.save();

        return res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error saving image to database:', error); // 에러 로그
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

export default router;


