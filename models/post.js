import mongoose from 'mongoose';

// 게시글 스키마 정의
const PostSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    postPassword: {
      type: String,
      required: true,
    },
    groupPassword: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false, // 선택적 필드
    },
    tags: {
      type: [String],
      required: false, // 선택적 필드
    },
    location: {
      type: String,
      required: false, // 선택적 필드
    },
    moment: {
      type: Date,
      required: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// Post 모델 정의
const Post = mongoose.model('Post', PostSchema);

export default Post;
