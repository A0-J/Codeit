import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';

// UUID를 숫자형으로 변환하는 함수
function uuidToNumber(uuid) {
    const buffer = Buffer.from(uuid.replace(/-/g, ''), 'hex'); // UUID에서 '-' 제거 후 Buffer로 변환
    let number = BigInt(0);
    
    // Buffer의 각 바이트를 BigInt로 변환
    for (const byte of buffer) {
        number = (number << BigInt(8)) | BigInt(byte);
    }
    
    return Number(number); // Number로 변환
}

const groupSchema = new mongoose.Schema({
    _id: {
        type: Number, // _id를 숫자형으로 설정
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
    },  // 비밀번호는 실제로는 해시를 저장해야 합니다.
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
});

// `pre` 미들웨어에서 `UUID`를 생성하여 `_id`를 숫자형으로 변환
groupSchema.pre('save', function(next) {
    if (this.isNew) {
        const uuid = uuidv4();
        this._id = uuidToNumber(uuid);
    }
    next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
