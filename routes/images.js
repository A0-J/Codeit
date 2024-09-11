// routes/images.js
import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';

const router = express.Router();

// AWS S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  })
});

router.post('/', upload.single('file'), (req, res) => {
  res.send({ file: req.file });
});

export default router;

