import { MessageModel } from '../models/MessageModel.js';

export const ChatService = {
    /**
     * 持久化儲存使用者多模態訊息 (升級為結構化多附件陣列規格)
     * @param {Object} msgData - 包含用戶與頻道元數據的物件
     * @param {Array} parsedAssets - 經控制層並行解析後的完全體資產陣列
     */
    async saveUserMessage(msgData, parsedAssets) {
        // [2026-06-07T22:10:12.100Z][BACKEND][ChatService.js][DB_WRITE] 執行多模態陣列結構化落盤
        
        // 核心重構：直接建立完全相容新 Schema 的訊息主體
        const userMessage = await MessageModel.create({
            guildId: msgData.guildId,
            channelId: msgData.channelId,
            userId: msgData.userId,
            username: msgData.username,
            role: 'user',
            // 若無文字提問則自動填充，防範空值地雷
            content: msgData.content || `[發送了附件: ${msgData.attachments.map(a => a.fileName).join(', ')}]`,
            
            // 原生灌入完整映射後的附件陣列，徹底拋棄舊版子表與單檔限制
            attachments: msgData.attachments || []
        });

        return userMessage;
    },

    /**
     * 持久化儲存 AI 助手回應
     */
    async saveAssistantMessage(msgData, aiReply) {
        return await MessageModel.create({
            guildId: msgData.guildId,
            channelId: msgData.channelId,
            userId: 'ollama_bot',
            username: 'Ollama_Bot',
            role: 'assistant',
            content: aiReply,
            attachments: [] // 助手回應預設無附件陣列
        });
    }
};