import { MessageModel } from '../models/MessageModel.js';
import { ImageModel } from '../models/ImageModel.js';
import { DocumentModel } from '../models/DocumentModel.js';
import { ChunkModel } from '../models/ChunkModel.js';

export const AdminService = {
    /**
     * 執行全資料庫儲存計數審計
     */
    async getStorageAudit() {
        const [messages, images, docs, chunks] = await Promise.all([
            MessageModel.countDocuments(),
            ImageModel.countDocuments(),
            DocumentModel.countDocuments(),
            ChunkModel.countDocuments()
        ]);
        return { messages, images, docs, chunks };
    },

    /**
     * 終極指令：全自動化多模型連鎖物理抹除
     */
    async flushAllStorage() {
        const results = await Promise.all([
            MessageModel.deleteMany({}),
            ImageModel.deleteMany({}),
            DocumentModel.deleteMany({}),
            ChunkModel.deleteMany({})
        ]);
        return {
            messages: results[0].deletedCount,
            images: results[1].deletedCount,
            documents: results[2].deletedCount,
            chunks: results[3].deletedCount
        };
    }
};