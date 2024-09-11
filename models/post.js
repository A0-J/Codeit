import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    _id: {
      type:Number,
      unique:true,
  },
    postId: {
      type: String,
      unique: true,
    },
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
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    location: {
      type: String,
      required: false,
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
    timestamps: true,
  }
);

PostSchema.pre('save', function(next) {
  if (this.isNew) {
    // 현재 시간을 기반으로 ID 생성 (예: 202409110001)
    const datePrefix = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 12); // YYYYMMDDHHmm
    this._id = datePrefix + (Math.floor(Math.random() * 1000)).toString().padStart(3, '0');
  }
  next();
});

const Post = mongoose.model('Post', PostSchema);

export default Post;

