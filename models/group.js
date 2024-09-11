// models/group.js
import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    _id: {
        type: Number, // _id를 숫자형으로 설정
        unique: true,
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

const Group = mongoose.model('Group', groupSchema);

export default Group;
