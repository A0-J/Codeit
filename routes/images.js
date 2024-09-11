import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Image from '../models/image.js';  // Mongoose Image 모델을 가져옵니다

// ES 모듈에서 __dirname 대신 사용하는 방법
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const router = express.Router();

// 저장할 디렉토리 설정
const uploadPath = path.join(__dirname, '../uploads/');

// Multer 설정: 이미지 저장 경로 및 파일 이름 지정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 디렉토리 생성 확인 및 생성
        if (!fs.existsSync(uploadPath)) {
            try {
                fs.mkdirSync(uploadPath, { recursive: true });
                console.log('Uploads directory created successfully.');
            } catch (err) {
                console.error('Error creating uploads directory:', err);
                return cb(err);
            }
        }
        // 지정된 경로에 파일 저장
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 파일 이름 설정
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

        // 이미지 파일을 지정된 폴더에 저장
        await newImage.save();

        console.log('Image saved successfully:', imageUrl);

        // 성공적으로 이미지 정보 저장 후 응답
        return res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error saving image to database:', error); // 에러 로그
        return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
    }
});

export default router;



