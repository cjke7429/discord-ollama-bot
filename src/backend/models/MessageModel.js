import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, default: '' },
    
    // 核心重構：物理拔除單一字串欄位，全面升級為結構化多模態物件陣列
    attachments: [{
        fileName: { type: String, required: true },
        attachmentUrl: { type: String, required: true },
        contentType: { type: String, required: true }
    }],
    
    createdAt: { type: Date, default: Date.now }
});

export const MessageModel = mongoose.model('Message', MessageSchema);