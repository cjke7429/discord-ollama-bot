import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true
    },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true }, // 例如: text/plain
    parsedContent: { type: String, required: true }, // 解析後的文字內容，供 LLM 讀取
    discordUrl: { type: String }
}, {
    timestamps: true,
    versionKey: false
});

export const DocumentModel = mongoose.model('Document', DocumentSchema);