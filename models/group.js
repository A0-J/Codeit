import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    groupId: {
        type: Number, // 실제로는 이 값을 사용하여 _id를 설정
        unique: true,
        required: true
    },
    name: { type: String, required: true },
    password: { type: String, required: true },  // 비밀번호는 실제로는 해시를 저장해야 합니다.
    imageUrl: { type: String, default: null },
    isPublic: { type: Boolean, required: true },
    introduction: { type: String, default: "" },
    likeCount: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    postCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

// 'id' 가상 필드를 정의하여 'groupId'를 '_id'로 반환
groupSchema.virtual('id').get(function() {
    return this.groupId;
});

// JSON으로 변환할 때 가상 필드 포함 설정
groupSchema.set('toJSON', { virtuals: true });

// 실제 _id 필드를 숨기고 가상 필드 'id'만 노출
groupSchema.set('toObject', { virtuals: true });

const Group = mongoose.model('Group', groupSchema);

export default Group;

