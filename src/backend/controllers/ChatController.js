import { DocumentParser } from '../utils/DocumentParser.js';
import { AiService } from '../services/AiService.js';
import { ChatService } from '../services/ChatService.js';
import { ChunkingUtil } from '../utils/ChunkingUtil.js'; // 👈 核心引入
import { KnowledgeBaseService } from '../services/KnowledgeBaseService.js'; // 👈 核心引入


export const ChatController = {
    handleChatMessage: async (req, res) => {
        try {
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js][INBOUND] 收到前端多模態對話請求 | 用戶: ${req.body.username || '未知'}`);

            const { guildId, channelId, userId, username, content, attachments } = req.body;

            const hasAttachments = attachments && attachments.length > 0;
            if (!content && !hasAttachments) {
                console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js][VALIDATION_FAILED] 拒絕無效請求：內容與附件不可同時為空`);
                return res.status(400).json({ status: 'error', message: '內容與附件不可同時為空。' });
            }

            // 1. 工具層：並行解析附件 (不論是圖片或文檔，全數併發抓取)
            let parsedAssets = [];
            if (hasAttachments) {
                console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js][CONCURRENCY] 啟動多附件並行解析管線，檔案總數: ${attachments.length}`);
                
                const parsePromises = attachments.map(async (att) => {
                    const rawResult = await DocumentParser.parse(att);
                    if (typeof rawResult === 'string') {
                        return { type: 'document', content: rawResult, fileName: att.name, url: att.url };
                    } else {
                        return { type: rawResult.type === 'image_base64' ? 'image_base64' : 'document', content: rawResult.content, fileName: att.name, url: att.url };
                    }
                });
                parsedAssets = await Promise.all(parsePromises);
            }

            // 2. 數據分離防線：物理抽離「純圖片陣列」與「文件文本切片陣列」
            let imageAssets = [];
            let textContexts = [];

            if (parsedAssets.length > 0) {
                parsedAssets.forEach(asset => {
                    if (asset.type === 'image_base64') {
                        imageAssets.push(asset.content); 
                    } else if (asset.type === 'document') {
                        const textChunks = ChunkingUtil.sliceText(asset.content, 500, 50);
                        // 將切片後的區塊各自打上 Chunk 標籤與物理編號，結構化推入 RAG 容器中
                        textChunks.forEach((chunk, index) => {
                            textContexts.push(`[資料源: ${asset.fileName} | 區塊位置: Chunk #${index + 1}]\n${chunk}`);
                        });
                    }
                });
            }

            // 2.5 數據合流防線：自動調度常駐知識庫執行語義檢索
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js][RAG] 啟動背景向量語義檢索...`);
            const kbContexts = await KnowledgeBaseService.searchRelevantContext(guildId, content || '');
            
            // 將常駐知識庫撈出來的切片，與本次對話臨時拖入的文件文字合併
            const totalContexts = [...textContexts, ...kbContexts];

            // 3. 提示詞結構化物理聚合
            let finalPrompt = '';
            const systemInstructions = `你是一個專業的工業級 AI 協同大腦。當前系統已導入【長效向量知識庫與即時多模態並行模式】。
                                        你的核心任務是同時解析輸入的「知識庫/文件參考上下文」與「隨附圖片視覺資產」，並嚴格遵循以下推理防線：
                                        1. 【跨模態互校】：請主動分析圖片中的視覺特徵與參考上下文之間是否存在互補、驗證或衝突關係。
                                        2. 【精確錨定】：在回答時，明確指出哪些結論源自常駐知識庫或參考文件，哪些特徵提取自視覺圖片。
                                        3. 【嚴謹回答】：保持高度專業性，少用可能、應該，只回答肯定且確切的資訊，不隨意猜測。`;

            if (totalContexts.length > 0) {
                finalPrompt = `${systemInstructions}\n\n========================================\n【多模態 RAG 聚合上下文】\n${totalContexts.join('\n\n')}\n========================================\n\n【使用者原生提問】\n${content || '請綜合審計上述所有背景知識與視覺特徵。'}`;
            } else {
                finalPrompt = `${systemInstructions}\n\n【使用者原生提問】\n${content || '請精確提取並分析此圖片的視覺特徵。'}`;
            }

            // 4. 服務層：發射真·多模態複合資產包至 AiService
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js][PROCESS] 派發混合多模態數據包至 AiService (圖片數: ${imageAssets.length} | 文件數: ${textContexts.length})`);
            
            const aiResult = await AiService.generateResponse(finalPrompt, {
                images: imageAssets,
                hasDocument: textContexts.length > 0
            });
            
            console.log(`[${new Date().toISOString()}][BACKEND][ChatController.js][SUCCESS] AI 多模態複合推理成功完成`);

            // 5. 服務層：資料庫結構化陣列持久化儲存
            const msgData = { 
                guildId, 
                channelId, 
                userId, 
                username, 
                content, 
                attachments: hasAttachments ? attachments.map(a => ({
                    fileName: a.name,
                    attachmentUrl: a.url,
                    contentType: a.contentType
                })) : []
            };
            
            ChatService.saveUserMessage(msgData, parsedAssets)
                .then(() => ChatService.saveAssistantMessage(msgData, aiResult.reply))
                .catch(dbErr => console.error(`[${new Date().toISOString()}][BACKEND][ChatController.js][DB_ERROR] 陣列持久化失敗:`, dbErr));

            // 6. 控制層：即時回傳標準 JSON
            return res.status(200).json({
                status: 'success',
                meta: aiResult.meta,
                reply: aiResult.reply
            });

        } catch (error) {
            console.error(`[${new Date().toISOString()}][BACKEND][ChatController.js][CRITICAL-WARNING] 控制器崩潰:`, error.stack);
            if (!res.headersSent) {
                return res.status(500).json({ status: 'error', message: '後端核心調度崩潰。' });
            }
        }
    }
};