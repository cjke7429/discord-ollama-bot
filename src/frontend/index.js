import { Client, GatewayIntentBits } from 'discord.js';
import { DiscordView } from './views/DiscordView.js'; 
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';


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



    // =========================================================================
    // [訊息] 核心重構防線：實作管理員 $kb-add 常駐知識庫建立指令 (無貼圖相容性版本)
    // =========================================================================
    if (message.content.startsWith('$kb-add')) {
        console.log(`[${new Date().toISOString()}][FRONTEND][index.js] 收到管理員知識庫持久化注入請求`);

        // 安全防線：檢查有無夾帶實體文件
        const attachment = message.attachments.first();
        if (!attachment) {
            return message.reply('[錯誤] 請求失敗：請同時拖入一個文字文檔 (.txt 或 .docx) 並輸入 $kb-add 進行知識庫建立。');
        }

        const loadingMsg = await message.reply('[處理中] 正在下載文檔並調度 Docker Ollama 執行 500 字滾動切片與向量計算...');

        try {
            // 1. 包裝標準資產封包
            const attData = {
                name: attachment.name,
                url: attachment.url,
                contentType: attachment.contentType || 'text/plain'
            };

            // 2. 派發數據包至後端管理員 RAG 注入端點
            const response = await axios.post(`${BACKEND_API}/api/v1/admin/kb-add`, {
                guildId: message.guildId,
                fileName: attData.name,
                attachmentUrl: attData.url
            });

            if (response.data.status === 'success') {
                return loadingMsg.edit(`[成功] 知識庫持久化收網成功！文檔 "${attData.name}" 已成功切碎為 ${response.data.chunkCount} 個高維度向量區塊，並永久落盤進常駐知識庫中。`);
            } else {
                return loadingMsg.edit(`[失敗] 知識庫建置失敗：${response.data.message}`);
            }

        } catch (err) {
            console.error(`[${new Date().toISOString()}][FRONTEND][index.js][CRITICAL-WARNING] 知識庫注入失敗:`, err.stack);
            return loadingMsg.edit(`[崩潰] 核心調度異常：${err.message}`);
        }
    }
    
    // 指令 [1]：審計健康與儲存計數
    if (message.content === '$count') {
        try {
            const res = await axios.get(`${BACKEND_API}/api/v1/admin/health`);
            const embed = DiscordView.renderSystemHealth(res.data);
            return message.reply({ embeds: [embed] });
        } catch (err) {
            return message.reply(`讀取審計報告失敗: ${err.message}`);
        }
    }

    // 指令 [2]：查看跨集合多模態關聯
    if (message.content === '$list') {
        console.log(`[${new Date().toISOString()}][FRONTEND][index.js][DEBUG_START] 啟動多模態關聯鏈路追蹤`);
        
        try {
            const targetUrl = `${BACKEND_API}/api/v1/admin/relations`;
            // 執行實體通訊
            const res = await axios.get(targetUrl);
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
            const res = await axios.delete(`${BACKEND_API}/api/v1/admin/data`);
            return message.reply(`[核心公告] ${res.data.message}\n所有 Model 集合計數已重設歸零。`);
        } catch (err) {
            return message.reply(`執行清空指令失敗: ${err.message}`);
        }
    }

    // ────────────────────────────────────────────────
    // 模組二：多模態對話核心串接 (@機器人 提問)
    // ────────────────────────────────────────────────
   if (message.mentions.has(client.user)) {
        await message.channel.sendTyping();

        const cleanPrompt = message.content.replace(/<@!\d+>|<@\d+>/g, '').trim();
        
        // 變更為陣列規格，準備接收多個附件
        let attachmentsPayload = [];

        // [2026-06-07T21:33:41.010Z][FRONTEND][index.js][PROCESS] 升級多附件 UUID 安全沙盒隔離機制
        if (message.attachments.size > 0) {
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][CONCURRENCY] 偵測到傳入附件，啟動 UUID 物理隔離，數量: ${message.attachments.size}`);
            
            attachmentsPayload = Array.from(message.attachments.values()).map((att, index) => {
                const fileExtension = path.extname(att.name);
                
                // 核心優化：引入 crypto.randomUUID() 或高效隨機碼，徹底拋棄原始檔名，封閉特殊字元地雷
                const secureUniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const tempFileName = `msg_${message.id}_att_${index}_${secureUniqueId}${fileExtension}`;
                
                return {
                    url: att.url,
                    name: att.name,       
                    contentType: att.contentType,
                    tempName: tempFileName 
                };
            });
        }
        

        try {
            console.log(`[${new Date().toISOString()}][FRONTEND][index.js][NET_OUTBOUND] 向後端發射多模態陣列請求`);
            const res = await axios.post(`${BACKEND_API}/api/v1/chats`, {
                guildId: message.guildId,
                channelId: message.channelId,
                userId: message.author.id,
                username: message.author.username,
                content: cleanPrompt,
                attachments: attachmentsPayload
            });

            const replyEmbed = DiscordView.renderAiReply(res.data.reply, res.data.meta);
            await message.reply({ embeds: [replyEmbed] });

        } catch (error) {
            console.error(`[${new Date().toISOString()}][FRONTEND][index.js][NET_ERROR_FATAL] 後端核心調度超時或拒絕連線:`, error.message);
            await message.reply(`後端核心推理大腦拒絕連線或處理超時。`);
        }
    }
});

// 啟動登入防線
if (!process.env.DISCORD_TOKEN) {
    console.error(`[${new Date().toISOString()}][FRONTEND][index.js] 啟動失敗：環境變數 DISCORD_TOKEN 未定義。`);
    process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);