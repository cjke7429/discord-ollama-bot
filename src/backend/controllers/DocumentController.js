import { DocumentService } from '../services/DocumentService.js';

export const DocumentController = {
    uploadDocument: async (req, res) => {
        try {
            const { url, name, guildId, channelId } = req.body;
            if (!url || !name) {
                return res.status(400).json({ status: 'error', message: '缺少檔案 url 或 name。' });
            }

            const doc = await DocumentService.processAndIngestDocument({ url, name, guildId, channelId });
            
            return res.status(202).json({
                status: 'success',
                message: '文件已接收，正在背景進行 RAG 向量化切片。',
                data: { documentId: doc._id, fileName: name, status: 'processing' }
            });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    },

    listDocuments: async (req, res) => {
        try {
            const docs = await DocumentService.getAllDocuments();
            return res.status(200).json({ status: 'success', count: docs.length, data: docs });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    },

    deleteDocument: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedDoc = await DocumentService.deleteDocumentAndChunks(id);
            if (!deletedDoc) {
                return res.status(404).json({ status: 'error', message: '找不到該文件。' });
            }
            return res.status(200).json({ status: 'success', message: `文件 [${deletedDoc.fileName}] 已連鎖物理刪除。` });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
};