import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
    // 關聯：指向這張圖片所屬的訊息主體
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true // 建立索引，方便未來依訊息反查圖片
    },
    userId: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true }, // 例如: image/png
    base64Data: { type: String, required: true }, // 核心 Base64 數據
    discordUrl: { type: String } // 備份 Discord CDN 原始連結
}, {
    timestamps: true, // 自動生成 createdAt, updatedAt
    versionKey: false
});

export const ImageModel = mongoose.model('Image', ImageSchema);