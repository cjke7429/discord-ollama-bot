import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
    // 🎯 核心關聯：指向這筆切片所屬的原始文件
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true // 建立索引，優化依文件清理或查找切片的速度
    },
    // 🎯 選填關聯：如果這筆切片是來自某條 Discord 訊息的對話紀錄，則指向該訊息
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        index: true
    },
    // 📄 切碎後的純文字片段內容
    textSegment: { 
        type: String, 
        required: true 
    },
    
    // 🧠 RAG 核心：儲存 Embedding 向量數據 (浮點數陣列)
    // 預期對應 Ollama 的 nomic-embed-text (768 維度) 或 OpenAI 的 text-embedding-3-small (1536 維度)
    embedding: {
        type: [Number],
        required: true
    },
    
    // 🛡️ 資訊安全與檢索過濾元數據 (Metadata Filter)
    // RAG 檢索時極度重要，用來防止 A 頻道的用戶透過向量搜尋查到 B 頻道的機密文件
    metadata: {
        guildId: { type: String, required: true, index: true },
        channelId: { type: String, required: true, index: true },
        fileName: { type: String, required: true }
    }
}, {
    timestamps: true, // 自動生成 createdAt, updatedAt，方便追蹤索引建立時間
    versionKey: false
});

// 建立複合索引（優化特定頻道內的向量篩選速度）
ChunkSchema.index({ "metadata.channelId": 1, "metadata.guildId": 1 });

export const ChunkModel = mongoose.model('Chunk', ChunkSchema);