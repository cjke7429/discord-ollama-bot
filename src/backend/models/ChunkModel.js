// src/backend/models/ChunkModel.js
import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
    guildId: { type: String, required: true },       // 鎖定 Discord 伺服器，隔離知識庫
    fileName: { type: String, required: true },      // 原始檔案名稱
    content: { type: String, required: true },       // 切片後的實體純文字內容
    chunkIndex: { type: Number, required: true },    // 區塊物理編號
    
    // 核心重構：引入向量陣列欄位，用於儲存 Embedding 矩陣
    embedding: {
        type: [Number],
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

export const ChunkModel = mongoose.model('Chunk', ChunkSchema);