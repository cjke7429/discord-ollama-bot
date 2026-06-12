// src/backend/services/KnowledgeBaseService.js
import { ChunkModel } from '../models/ChunkModel.js';
import { EmbeddingService } from './EmbeddingService.js';
import { ChunkingUtil } from '../utils/ChunkingUtil.js';

export const KnowledgeBaseService = {
    /**
     * 1. 知識庫物理落盤管線 ($kb-add 呼叫)
     */
    addDocument: async (guildId, fileName, fullText) => {
        console.log(`[${new Date().toISOString()}][BACKEND][KnowledgeBaseService][PROCESS] 開始處理常駐知識庫建置: ${fileName}`);
        
        // A. 滾動窗格切片 (500字, 10%重疊)
        const chunks = ChunkingUtil.sliceText(fullText, 500, 50);
        
        // B. 併發計算向量並寫入 MongoDB
        const savePromises = chunks.map(async (content, index) => {
            const vector = await EmbeddingService.getEmbedding(content);
            return ChunkModel.create({
                guildId,
                fileName,
                content,
                chunkIndex: index + 1,
                embedding: vector
            });
        });
        
        await Promise.all(savePromises);
        console.log(`[${new Date().toISOString()}][BACKEND][KnowledgeBaseService][SUCCESS] 知識庫同步完畢，成功落盤 ${chunks.length} 個向量切片`);
        return chunks.length;
    },

    /**
     * 2. 語義檢索管線 (ChatController 背景調度)
     */
    searchRelevantContext: async (guildId, userQuery, limit = 3) => {
        try {
            // A. 將用戶提問文字即時向量化
            const queryVector = await EmbeddingService.getEmbedding(userQuery);
            
            // B. 執行餘弦相似度檢索 (此處使用 MongoDB 聚合管道，若無專屬 Vector Index 則用全表加權計算)
            // 備註：這是在標準 MongoDB 內免開 Index 的餘弦相似度計演算法
            const allChunks = await ChunkModel.find({ guildId });
            
            const scoredChunks = allChunks.map(chunk => {
                // 計算兩個向量的點積 (Dot Product) 與模長
                let dotProduct = 0;
                let normA = 0;
                let normB = 0;
                for (let i = 0; i < queryVector.length; i++) {
                    dotProduct += queryVector[i] * chunk.embedding[i];
                    normA += queryVector[i] * queryVector[i];
                    normB += chunk.embedding[i] * chunk.embedding[i];
                }
                const cosSim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
                return { chunk, score: cosSim };
            });

            // C. 依相似度分數倒序排列，精選 Top K 區塊
            const topChunks = scoredChunks
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(item => `[常駐知識庫 - 來源: ${item.chunk.fileName}]\n${item.chunk.content}`);

            return topChunks;
        } catch (err) {
            console.error(`[${new Date().toISOString()}][BACKEND][KnowledgeBaseService][SEARCH_ERROR] 語義檢索失敗:`, err.message);
            return []; // 熔斷防禦：檢索失敗則回傳空，不阻塞常規對話
        }
    }
};