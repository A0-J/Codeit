// models/badge.js
import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    imageUrl: { 
        type: String 
    },
    criteria: {
        type: Map,
        of: String,
        required: true // 예: { streak: "7일 연속 추억 등록", count: "추억 수 20개 이상 등록" }
    }
});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
