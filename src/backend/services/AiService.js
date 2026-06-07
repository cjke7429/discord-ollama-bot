// src/backend/services/AiService.js
import axios from 'axios';

export const AiService = {
    /**
     * 依據解析後的附件類型，動態向 Ollama 發送推理請求
     * @param {string} userPrompt - 使用者的提問文字
     * @param {Object|null} parsedAsset - 經 DocumentParser 解析後的附件物件
     * @returns {Promise<{reply: string, meta: {modelUsed: string, hasAttachment: boolean, attachmentType: string}}>}
     */
    async generateResponse(userPrompt, parsedAsset) {
        // 網路與模型防線：全面對齊 .env 檔案，移除任何可能架空設定的硬編碼
        const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        
        // 核心修復 1：預設使用環境變數指定的完全體模型
        let targetModel = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
        
        let finalPrompt = userPrompt || '';
        let ollamaImages = [];
        let attachmentType = 'none';

        if (parsedAsset) {
            if (parsedAsset.type === 'image_base64') {
                // 核心修復 2：若環境變數有指定專屬的多模態模型則分流（例如預留舊架構）；
                // 若無指定，則直接交由現行的完全體多模態模型處理，不再盲目寫死 'llava'
                targetModel = process.env.OLLAMA_VISION_MODEL || process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
                ollamaImages.push(parsedAsset.content);
                attachmentType = 'image';
            } else {
                // 文字、PDF、Docx 解析出來的純文本上下文注入
                attachmentType = 'document';
                const textContent = typeof parsedAsset === 'string' ? parsedAsset : parsedAsset.content;
                finalPrompt = `【參考文件上下文】\n"""\n${textContent}\n"""\n\n使用者提問：${userPrompt || '請摘要此文件。'}`;
            }
        }

        const ollamaPayload = {
            model: targetModel,
            prompt: finalPrompt,
            stream: false
        };

        if (ollamaImages.length > 0) {
            ollamaPayload.images = ollamaImages;
        }
        console.log(`[${new Date().toISOString()}][BACKEND][AiService.js] 發送推理請求 | 使用模型: ${targetModel} | 模式: ${attachmentType}`);

        // 🎯 核心修復 3：將 timeout 設為 0（無限期等待），徹底杜絕 31B 巨型模型冷啟動載入時引發的 90 秒熔斷
        const response = await axios.post(`${OLLAMA_HOST}/api/generate`, ollamaPayload, { 
            timeout: 0 
        });

        return {
            reply: response.data.response,
            meta: {
                modelUsed: targetModel,
                hasAttachment: !!parsedAsset,
                attachmentType
            }
        };
    }
};