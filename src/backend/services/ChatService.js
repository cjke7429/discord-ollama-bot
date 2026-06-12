import { MessageModel } from '../models/MessageModel.js';
import { ImageModel } from '../models/ImageModel.js';
import { DocumentModel } from '../models/DocumentModel.js';

export const ChatService = {
    /**
     * 持久化儲存使用者多模態訊息及其附屬實體
     */
    async saveUserMessage(msgData, parsedAsset) {
        // A. 建立訊息主體
        const userMessage = await MessageModel.create({
            guildId: msgData.guildId,
            channelId: msgData.channelId,
            userId: msgData.userId,
            username: msgData.username,
            role: 'user',
            content: msgData.content || `[發送了附件: ${msgData.fileName}]`,
            hasAttachment: !!parsedAsset
        });

        // B. 根據資產類型進行關聯實體寫入
        if (parsedAsset) {
            if (parsedAsset.type === 'image_base64') {
                await ImageModel.create({
                    messageId: userMessage._id,
                    userId: msgData.userId,
                    fileName: msgData.fileName,
                    mimeType: `image/${msgData.fileName.split('.').pop().toLowerCase()}`,
                    base64Data: parsedAsset.content,
                    discordUrl: msgData.attachmentUrl
                });
            } else {
                const textContent = typeof parsedAsset === 'string' ? parsedAsset : parsedAsset.content;
                await DocumentModel.create({
                    messageId: userMessage._id,
                    fileName: msgData.fileName,
                    mimeType: 'text/plain',
                    parsedContent: textContent,
                    discordUrl: msgData.attachmentUrl
                });
            }
        }
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
            hasAttachment: false
        });
    }
};