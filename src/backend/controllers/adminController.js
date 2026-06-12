import { AdminService } from '../services/AdminService.js';
import { MessageModel } from '../models/MessageModel.js';
import mongoose from 'mongoose';

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

    getRelationHistory: async (req, res) => {
        try {
            const relations = await MessageModel.find({ hasAttachment: true })
                .populate('images')
                .populate('documents')
                .sort({ createdAt: -1 });

            return res.status(200).json({ status: 'success', data: relations });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
};