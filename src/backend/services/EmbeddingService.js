// src/backend/services/EmbeddingService.js
import axios from 'axios';

export const EmbeddingService = {
    /**
     * 調度 Ollama 提取文本的向量特徵矩陣
     * @param {string} text - 欲向量化的切片文本
     * @returns {Promise<Array<number>>} 浮點數向量陣列
     */
    getEmbedding: async (text) => {
        const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        // 預設使用業界開源標準的 Embedding 模型
        const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

        try {
            const response = await axios.post(`${OLLAMA_HOST}/api/embeddings`, {
                model: EMBED_MODEL,
                prompt: text
            });
            
            // Ollama 回傳的標準欄位為 response.data.embedding
            return response.data.embedding;
        } catch (error) {
            console.error(`[${new Date().toISOString()}][BACKEND][EmbeddingService.js][ERROR] 向量化提取失敗:`, error.message);
            throw error;
        }
    }
};