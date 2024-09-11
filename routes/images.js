import express from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
import Image from '../models/image.js';

dotenv.config();

const router = express.Router();

// AWS S3 설정
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer 설정
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        acl: 'public-read',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    })
});

// 이미지 업로드 및 URL 생성 API
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "이미지가 없습니다" });
        }

        const bucketUrl = process.env.AWS_S3_BUCKET_URL;
        const imageUrl = `${bucketUrl}/${req.file.key}`; // S3에서 업로드된 파일의 URL

        // 데이터베이스에 이미지 정보 저장
        const newImage = new Image({
            filename: req.file.key,
            url: imageUrl
        });

        await newImage.save();

        return res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error occurred:', error);

        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: "파일 업로드 오류", error: error.message });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "데이터베이스 검증 오류", error: error.message });
        }

        return res.status(500).json({ message: "서버 오류가 발생했습니다", error: error.message });
    }
});

export default router;

