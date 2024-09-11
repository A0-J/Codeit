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
}, {
    timestamps: true, // 생성일 및 업데이트일 자동 관리
});

// pre-save 훅을 사용하여 _id를 날짜 기반으로 자동 생성
groupSchema.pre('save', function (next) {
    if (this.isNew) {
        // 현재 시간을 기반으로 숫자형 ID 생성 (예: 202409110001)
        const datePrefix = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 12); // YYYYMMDDHHmm
        const randomSuffix = (Math.floor(Math.random() * 1000)).toString().padStart(3, '0'); // 세 자리 랜덤 숫자
        this._id = parseInt(datePrefix + randomSuffix, 10); // 숫자형 _id로 설정
    }
    next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
