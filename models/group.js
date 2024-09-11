import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    _id: {
        type: Number, // 숫자형 _id
        unique: true,
    },
    groupId: {
        type: String,
        unique: true,
    },
    name: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    imageUrl: { 
        type: String, 
        default: null 
    },
    isPublic: { 
        type: Boolean, 
        required: true 
    },
    introduction: { 
        type: String, 
        default: "" 
    },
    likeCount: { 
        type: Number, 
        default: 0 
    },
    badges: { 
        type: [String], 
        default: [] 
    },
    postCount: { 
        type: Number, 
        default: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
}, {
    timestamps: true,
    _id: false, // 기본 _id 비활성화
});

// `pre` 미들웨어에서 `_id`를 생성
groupSchema.pre('save', function(next) {
    if (this.isNew) {
        // 현재 시간을 기반으로 ID 생성 (예: 202409110001)
        const datePrefix = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 12); // YYYYMMDDHHmm
        this._id = parseInt(datePrefix + (Math.floor(Math.random() * 1000)).toString().padStart(3, '0'), 10);
    }
    next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;

