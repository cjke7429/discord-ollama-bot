import { DocumentParser } from '../utils/DocumentParser.js';
import { AiService } from '../services/AiService.js';
import { ChatService } from '../services/ChatService.js';

export const ChatController = {
    handleChatMessage: async (req, res) => {
        
        try {
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js] [INBOUND] 收到前端對話請求 | 用戶 ID: ${req.body.userId || '未知'}`);

            const { guildId, channelId, userId, username, content, attachment } = req.body;

            if (!content && !attachment) {
                console.warn(`[${new Date().toISOString()}][BACKEND][ChatController.js] [VALIDATION_FAILED] 收到空字串且無附件之無效請求`);
                return res.status(400).json({ status: 'error', message: '內容與附件不可同時為空。' });
            }

            // 1. 工具層：解析資產
            let parsedAsset = null;
            if (attachment && attachment.url) {
                parsedAsset = await DocumentParser.parse(attachment);
            }

            // 2. 服務層：呼叫 AI 引擎進行推理分流
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js] [PROCESS] 開始調度 ChatService 進行多模態處理...`);
            const aiResult = await AiService.generateResponse(content, parsedAsset);
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js] [SUCCESS] AI 推理與向量落盤成功 | 回應字數: ${aiResult.length}`);

            // 3. 服務層：執行非同步持久化儲存 (不阻塞推理結果回傳)
            const msgData = { guildId, channelId, userId, username, content, fileName: attachment?.name, attachmentUrl: attachment?.url };
            
            Promise.all([
                ChatService.saveUserMessage(msgData, parsedAsset),
                ChatService.saveAssistantMessage(msgData, aiResult.reply)
            ]).catch(dbErr => console.error(`[DB_Async_Storage_Failed]`, dbErr));

            // 4. 控制層：即時回傳標準 JSON
            return res.status(200).json({
                status: 'success',
                meta: aiResult.meta,
                reply: aiResult.reply
            });

        } catch (error) {
            console.error(`[${new Date().toISOString()}][BACKEND][ChatController.js] 錯誤細節 (Stack):[ChatController_Fatal]`, error.stack);
            // 針對 Ollama 專門排除提示
            if (error.code === 'ECONNREFUSED' || error.message.includes('11434')) {
                console.error(`[${new Date().toISOString()}][BACKEND][ChatController.js] 偵測到 Docker Ollama 斷線！請檢查 docker ps 確保容器存活。`);
            }
            return res.status(500).json({ status: 'error', message: '後端核心調度崩潰。', details: error.message });
        }
    }
};