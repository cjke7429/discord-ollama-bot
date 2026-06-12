// src/backend/services/AiService.js
import axios from 'axios';

export const AiService = {
    /**
     * 接收複合資產包，向 Ollama 發送完全體多模態推理
     * @param {string} userPrompt - 經控制層拼裝完成的純淨提問與文件文字上下文
     * @param {Object} assetPackage - 包含分離後圖片陣列與文件狀態的包裹物件
     * @returns {Promise<{reply: string, meta: {modelUsed: string, hasAttachment: boolean, attachmentType: string}}>}
     */
    async generateResponse(userPrompt, assetPackage = { images: [], hasDocument: false }) {
        const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        let targetModel = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
        
        const ollamaImages = assetPackage.images || [];
        const hasImage = ollamaImages.length > 0;
        const hasDocument = assetPackage.hasDocument || false;

        // 多模態視覺模型分流防線
        if (hasImage) {
            targetModel = process.env.OLLAMA_VISION_MODEL || process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
        }

        // 精確判定混合型態標籤 (供前端 DiscordView 渲染 Footer 使用)
        let attachmentType = 'none';
        if (hasImage && hasDocument) attachmentType = 'mixed'; // 同時存在圖片與文件
        else if (hasImage) attachmentType = 'image';
        else if (hasDocument) attachmentType = 'document';

        const ollamaPayload = {
            model: targetModel,
            prompt: userPrompt, // 接收控制層組裝好的純淨 Prompt，絕不重複包裝
            stream: false
        };

        // 如果封包內有圖片，將完整的 base64 陣列直接灌入 Ollama 核心
        if (ollamaImages.length > 0) {
            ollamaPayload.images = ollamaImages;
        }

        console.log(`[${new Date().toISOString()}][BACKEND][AiService.js] 發送推理請求 | 模型: ${targetModel} | 模式: ${attachmentType} | 傳入圖片總數: ${ollamaImages.length}`);

        const response = await axios.post(`${OLLAMA_HOST}/api/generate`, ollamaPayload, { 
            timeout: 0 // 無限期等待，死守巨型模型冷啟動
        });

        return {
            reply: response.data.response,
            meta: {
                modelUsed: targetModel,
                hasAttachment: hasImage || hasDocument,
                attachmentType
            }
        };
    }
};