import mongoose from 'mongoose';

// 댓글 스키마 정의
const CommentSchema = new mongoose.Schema(
    {
        nickname: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        password: {  // 비밀번호 필드 추가
            type: String,
            required: true,
        }
    },
    {
        timestamps: true, // 자동으로 createdAt 및 updatedAt 필드 추가
    }
);

// Comment 모델 정의
const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;

