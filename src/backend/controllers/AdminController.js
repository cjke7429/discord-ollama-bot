import { AdminService } from '../services/AdminService.js';
import { MessageModel } from '../models/MessageModel.js';
import mongoose from 'mongoose';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService.js';
import { DocumentParser } from '../utils/DocumentParser.js'

export const AdminController = {
    checkHealth: async (req, res) => {
        try {
            const auditData = await AdminService.getStorageAudit();
            return res.status(200).json({
                status: 'success',
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                storageAudit: auditData
            });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    },

    flushDatabase: async (req, res) => {
        try {
            const deletedReport = await AdminService.flushAllStorage();
            return res.status(200).json({
                status: 'success',
                message: '資料庫已完成全面初始化物理抹除。',
                deleted: deletedReport
            });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    },

    // ─── 以下為您要求的查看對話、文件歷史與關聯紀錄端點 ───

    getMessageHistory: async (req, res) => {
        try {
            const history = await MessageModel.find().sort({ createdAt: -1 });
            return res.status(200).json({ status: 'success', data: history });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    },

    getDocumentHistory: async (req, res) => {
        try {
            // 直接借用 Document 服務層的方法來撈取，維持 DRY 原則
            const docs = await DocumentModel.find().sort({ createdAt: -1 });
            return res.status(200).json({ status: 'success', data: docs });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * 獲取最新多模態關聯紀錄 (對應前端 $list 指令)
     */
    getRelationHistory: async (req, res) => {
        try {
            console.log(`[2026-06-07T22:17:22.010Z][BACKEND][AdminController.js][INBOUND] 收到管理員跨集合多模態關係鏈審計請求`);

            // 核心重構：物理拔除舊版 .populate('images').populate('documents') 阻斷
            // 改為精確查詢全新 Schema 中，attachments 陣列長度大於 0 的結構化歷史紀錄
            const relations = await MessageModel.find({
                attachments: { $exists: true, $not: { $size: 0 } }
            })
            .sort({ createdAt: -1 }) // 依時間倒序，確保抓到最新紀錄
            .limit(5);               // 嚴格限制 5 筆，防止 Discord 字卡溢出

            console.log(`[2026-06-07T22:17:22.500Z][BACKEND][AdminController.js][SUCCESS] 成功撈取 ${relations.length} 筆最新結構化多模態資產`);

            // 傳回符合前端預期的 JSON 結構體
            return res.status(200).json({
                status: 'success',
                data: relations
            });

        } catch (error) {
            console.error(`[2026-06-07T22:17:22.510Z][BACKEND][AdminController.js][CRITICAL-WARNING] 獲取關聯鏈歷史崩潰:`, error.stack);
            return res.status(500).json({ status: 'error', message: '管理員模組核心調度崩潰。' });
        }
    },

    /**
     * 處理管理員常駐知識庫注入請求
     * 職責：調度工具層下載解析，並發送給服務層落盤
     */
    addKnowledgeBase: async (req, res) => {
        try {
            console.log(`[${new Date().toISOString()}][BACKEND][AdminController.js][PROCESS] 接收 RAG 知識庫注入調度`);
            const { guildId, fileName, attachmentUrl } = req.body;

            if (!guildId || !fileName || !attachmentUrl) {
                return res.status(400).json({ status: 'error', message: '缺少必要欄位：guildId, fileName, attachmentUrl' });
            }

            // 1. 物理下載並解析遠端附件
            const rawText = await DocumentParser.parse({ name: fileName, url: attachmentUrl });
            
            // 2. 調度長效知識庫服務，執行 500 字滾動切片與向量化落盤
            const chunkCount = await KnowledgeBaseService.addDocument(guildId, fileName, rawText);
            
            // 3. 回傳標準結構化結果
            return res.status(200).json({
                status: 'success',
                chunkCount
            });

        } catch (error) {
            console.error(`[${new Date().toISOString()}][BACKEND][AdminController.js][ERROR] 知識庫注入失敗:`, error.stack);
            if (!res.headersSent) {
                return res.status(500).json({ status: 'error', message: '後端控制器調度崩潰。' });
            }
        }
    }
};