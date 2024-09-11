import express from 'express';  // express 모듈을 import해야 합니다
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
import Image from '../models/image';  // 데이터베이스 모델을 import해야 합니다

dotenv.config();

const router = express.Router();  // express.Router()를 사용하여 router 정의

// AWS S3 설정
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
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
    if (!req.file) {
        return res.status(400).json({ message: "이미지가 없습니다" });
    }

    const imageUrl = req.file.location; // S3에서 업로드된 파일의 URL

    try {
        // 데이터베이스에 이미지 정보 저장
        const newImage = new Image({
            filename: req.file.key,
            url: imageUrl
        });

        await newImage.save();

        return res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error saving image to database:', error);
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

export default router;  // router를 default로 내보냅니다
