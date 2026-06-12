import { EmbedBuilder } from 'discord.js';

//修改DiscordView.js為大寫開頭
/**
 * @class DiscordView
 * @description 專職負責 Discord 介面（Embeds）的視覺排版與渲染
 */
export const DiscordView = {
    /**
     * 渲染 AI 的標準回應
     * @param {string} replyText - AI 生成的回答
     * @param {Object} meta - 後端回傳的元數據 (模型名稱、附件類型)
     * @returns {EmbedBuilder}
     */
    renderAiReply: (replyText, meta) => {
        return new EmbedBuilder()
            .setColor('#5865F2') // Discord 經典藍
            .setDescription(replyText)
            .setFooter({ text: `推理引擎: ${meta.modelUsed} | 附件架構: ${meta.attachmentType}` })
            .setTimestamp();
    },

    /**
     * 渲染系統狀態與資料庫儲存審計報告 (對應 !sys health)
     * @param {Object} healthData - 後端 AdminController 回傳的統計 JSON
     * @returns {EmbedBuilder}
     */
    renderSystemHealth: (healthData) => {
        const { messages, images, docs, chunks } = healthData.storageAudit;
        return new EmbedBuilder()
            .setColor('#57F287') // 系統健全綠
            .setTitle('輕量工作站：架構健全度與儲存審計報告')
            .addFields(
                { name: '數據庫連線', value: `\`${healthData.database}\``, inline: true },
                { name: '總對話存量', value: `\`${messages} 條\``, inline: true },
                { name: '圖片資料表', value: `\`${images} 筆\``, inline: true },
                { name: '知識庫文件', value: `\`${docs} 份\``, inline: true },
                { name: 'RAG 向量切片', value: `\`${chunks} 塊\``, inline: true }
            )
            .setTimestamp();
    },

    /**
     * 渲染跨集合多模態關聯紀錄 (對應 !sys relations)
     * @param {Array} relations - 包含 populate 圖片與文件的訊息陣列
     * @returns {EmbedBuilder}
     */
    renderRelationsHistory: (relations) => {
        const embed = new EmbedBuilder()
            .setColor('#FEE75C') // 警示黃
            .setTitle('🔗 跨集合多模態關聯鏈審計 (最新 5 筆)');

        if (!relations || relations.length === 0) {
            embed.setDescription('目前資料庫中沒有任何附帶檔案的關聯紀錄。');
            return embed;
        }

        // 僅撈取最新 5 筆進行輕量化渲染，防止 Discord 訊息字數溢出
        relations.slice(0, 5).forEach((msg, idx) => {
            const fileList = [
                ...msg.images.map(i => `${i.fileName}`),
                ...msg.documents.map(d => `${d.fileName}`)
            ].join(', ') || '無實體附件';

            embed.addFields({
                name: `紀錄 #${idx + 1} - 用戶: ${msg.username}`,
                value: `**提問內容**: ${msg.content || '[僅發送附件]'}\n**鏈結資產**: ${fileList}\n**時間**: \`${new Date(msg.createdAt).toLocaleString()}\``
            });
        });

        return embed;
    }
};