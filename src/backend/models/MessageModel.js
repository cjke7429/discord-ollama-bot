import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },    // Discord 伺服器 ID
    channelId: { type: String, required: true, index: true },  // 頻道 ID
    userId: { type: String, required: true, index: true },     // 使用者 ID
    username: { type: String, required: true },                // 使用者名稱
    role: { 
        type: String, 
        enum: ['user', 'assistant', 'system'], 
        required: true 
    },
    content: { type: String, required: true },                 // 對話文字內容
    hasAttachment: { type: Boolean, default: false }           // 快速標記是否有附件，優化查詢
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true }, // 啟用虛擬屬性，轉換為 JSON 時會包含關聯資料
    toObject: { virtuals: true }
});

// 🎯 OO 邏輯高級技巧：建立虛擬關聯 (Virtual Populate)
// 這樣做可以在不影響 Message 體積的情況下，像呼叫普通欄位一樣載入圖片與文件

MessageSchema.virtual('images', {
    ref: 'Image',          // 關聯的 Model 名稱
    localField: '_id',     // Message 的主鍵
    foreignField: 'messageId' // Image 內對應的對齊外鍵
});

MessageSchema.virtual('documents', {
    ref: 'Document',
    localField: '_id',
    foreignField: 'messageId'
});

export const MessageModel = mongoose.model('Message', MessageSchema);