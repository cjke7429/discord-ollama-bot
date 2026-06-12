import { Client, GatewayIntentBits } from 'discord.js';
import { DiscordView } from './views/DiscordView.js'; 
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 初始化 Bot 客戶端，僅開啟 MVP 測試所需的最小權限防線
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 基於 Portable 環境配置的後端 API 根路徑
const BACKEND_API = process.env.BACKEND_API

client.once('clientReady', () => {
    console.log(`[${new Date().toISOString()}][FRONTEND][index.js] Discord 前端 Client 已成功啟動。登入身份: ${client.user.tag}`);
});

/**
 * 訊息事件監聽器 (Event Listener)
 */
client.on('messageCreate', async (message) => {
    // 門衛防線：忽略所有機器人自身的訊息，防止無限循環自殺漏洞
    if (message.author.bot) return;

    // ────────────────────────────────────────────────
    // ⚙️ 模組一：維運指令集測試 (MVP 最小開發版)
    // ────────────────────────────────────────────────
    
    // 指令 [1]：審計健康與儲存計數
    if (message.content === '$count') {
        try {
            const res = await axios.get(`${BACKEND_API}/v1/admin/health`);
            const embed = DiscordView.renderSystemHealth(res.data);
            return message.reply({ embeds: [embed] });
        } catch (err) {
            return message.reply(`讀取審計報告失敗: ${err.message}`);
        }
    }

    // 指令 [2]：查看跨集合多模態關聯
    // 指令 [2]：查看跨集合多模態關聯
    if (message.content === '$list') {
        console.log(`[${new Date().toISOString()}][FRONTEND][index.js][DEBUG_START] 啟動多模態關聯鏈路追蹤`);
        
        try {
            // 🔬 探針 1：審計環境變數
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][ENV_CHECK_API] process.env.BACKEND_API = ${process.env.BACKEND_API || 'undefined'}`);
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][ENV_CHECK_PORT] process.env.BACKEND_PORT = ${process.env.BACKEND_PORT || 'undefined'}`);
            
            // 🔬 探針 2：審計作用域變數值
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][VARIABLE_CHECK] BACKEND_API = ${BACKEND_API}`);
            
            // 🔬 探針 3：審計最終送出的實體 URL
            const targetUrl = `${BACKEND_API}/v1/admin/relations`;
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][NET_RECON] Axios 發送目標 = ${targetUrl}`);

            // 執行實體通訊
            const res = await axios.get(targetUrl);
            
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][NET_SUCCESS] 接收響應狀態碼 = ${res.status}`);
            const embed = DiscordView.renderRelationsHistory(res.data.data);
            return message.reply({ embeds: [embed] });
            
        } catch (err) {
            console.error(`[${new Date().toISOString()}][FRONTEND][index.js][NET_ERROR_FATAL] 通訊阻斷發生`);
            
            if (err.response) {
                // 伺服器有回應但狀態碼非 2xx
                console.error(`[${new Date().toISOString()}][FRONTEND][index.js][RESPONSE_STATUS] 回應狀態碼 = ${err.response.status}`);
                console.error(`[${new Date().toISOString()}][FRONTEND][index.js][RESPONSE_HEADERS] 回應 Header = ${JSON.stringify(err.response.headers)}`);
            } else if (err.request) {
                // 請求已發出但未收到回應
                console.error(`[${new Date().toISOString()}][FRONTEND][index.js][REQUEST_NO_RESPONSE] 請求已發射，但後端完全未響應`);
            } else {
                // 其他組態錯誤
                console.error(`[${new Date().toISOString()}][FRONTEND][index.js][AXIOS_CONFIG_ERROR] 核心組態配置錯誤 = ${err.message}`);
            }
            
            return message.reply(`[錯誤] 讀取關聯歷史失敗: ${err.message}`);
        }
    }

    // 指令 [3]：一鍵物理抹除資料庫
    if (message.content === '$flush') {
        try {
            const res = await axios.delete(`${BACKEND_API}/v1/admin/data`);
            return message.reply(`[核心公告] ${res.data.message}\n所有 Model 集合計數已重設歸零。`);
        } catch (err) {
            return message.reply(`執行清空指令失敗: ${err.message}`);
        }
    }

    // ────────────────────────────────────────────────
    // 模組二：多模態對話核心串接 (@機器人 提問)
    // ────────────────────────────────────────────────
    if (message.mentions.has(client.user)) {
        // 觸發 Discord 原生的「Bot 正在輸入中...」視覺動態
        await message.channel.sendTyping();

        // 清洗文本：移除 @機器人 的雪花標籤，留下純淨的使用者提問
        const cleanPrompt = message.content.replace(/<@!\d+>|<@\d+>/g, '').trim();
        
        let attachmentPayload = null;

        // 多模態附件攔截：若有上傳檔案（如 1.txt 或圖片），封裝其 CDN 網址與名稱
        if (message.attachments.size > 0) {
            const firstFile = message.attachments.first();
            attachmentPayload = {
                url: firstFile.url,
                name: firstFile.name
            };
        }

        try {
            // ➔ 將封裝好的多模態 Payload 精確派發給後端的 ChatController
            const res = await axios.post(`${BACKEND_API}/v1/chats`, {
                guildId: message.guildId,
                channelId: message.channelId,
                userId: message.author.id,
                username: message.author.username,
                content: cleanPrompt,
                attachment: attachmentPayload
            });

            // ➔ 調用 View 層，將 AI 回應與元數據漂亮地呈現在頻道中
            const replyEmbed = DiscordView.renderAiReply(res.data.reply, res.data.meta);
            await message.reply({ embeds: [replyEmbed] });

        } catch (error) {
            console.error(`[Frontend_Call_Backend_Error]`, error.message);
            await message.reply(`後端核心推理大腦拒絕連線或處理超時。`);
        }
    }
});

// 啟動登入防線
if (!process.env.DISCORD_TOKEN) {
    console.error('[${new Date().toISOString()}][FRONTEND][index.js] 啟動失敗：環境變數 DISCORD_TOKEN 未定義。');
    process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);