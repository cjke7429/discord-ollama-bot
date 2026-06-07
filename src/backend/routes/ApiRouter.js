import { Router } from 'express';
import { ChatController } from '../controllers/ChatController.js';
import { DocumentController } from '../controllers/DocumentController.js';
import { AdminController } from '../controllers/AdminController.js';

const ApiRouter = Router();

// =========================================================================
// [V1] 對話核心端點 (資源: chats)
// =========================================================================
ApiRouter.post('/v1/chats', ChatController.handleChatMessage);

// =========================================================================
// [V1] 知識庫管理端點 (資源: documents)
// =========================================================================
ApiRouter.post('/v1/documents', DocumentController.uploadDocument);
ApiRouter.get('/v1/documents', DocumentController.listDocuments);
ApiRouter.delete('/v1/documents/:id', DocumentController.deleteDocument);

// =========================================================================
// [V1] 系統運維端點 (資源: admin)
// =========================================================================
// 1. 獲取當前系統健康度
ApiRouter.get('/v1/admin/health', AdminController.checkHealth);

// 2. 獲取多模態跨集合關聯歷史紀錄 (精確對齊前端，消除 404 地雷)
ApiRouter.get('/v1/admin/relations', AdminController.getRelationHistory);

// 3. 物理抹除資料庫數據資源 (將 POST 動作型路徑改為標準 DELETE 語意)
ApiRouter.delete('/v1/admin/data', AdminController.flushDatabase);

export {ApiRouter};