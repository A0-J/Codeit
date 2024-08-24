import mongoose from 'mongoose';

// 이미지 스키마 정의
const imageSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// 이미지 모델 정의
const Image = mongoose.model('Image', imageSchema);

export default Image;
