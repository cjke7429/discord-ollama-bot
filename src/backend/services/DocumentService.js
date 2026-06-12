import { DocumentModel } from '../models/DocumentModel.js';
import { ChunkModel } from '../models/ChunkModel.js';
import { DocumentParser } from '../utils/DocumentParser.js';

export const DocumentService = {
    /**
     * 接收檔案並啟動 RAG 向量化流水線
     */
    async processAndIngestDocument(fileInfo) {
        // A. 在資料庫建立一筆初始狀態為 'processing' 的文件紀錄
        const documentEntity = await DocumentModel.create({
            fileName: fileInfo.name,
            mimeType: `text/${fileInfo.name.split('.').pop().toLowerCase()}`,
            parsedContent: 'Processing...',
            ragStatus: 'processing'
        });

        // B. 非同步執行 RAG 背景處理 Pipeline (不阻塞 HTTP 主線程)
        (async () => {
            try {
                // 1. 調用工具層解析
                const parsedText = await DocumentParser.parse({ url: fileInfo.url, name: fileInfo.name });
                const finalContent = typeof parsedText === 'string' ? parsedText : parsedText.content;

                // 2. 文本切片 (Chunking) - 示範每 400 字切一塊
                const chunkSize = 400;
                const chunks = [];
                for (let i = 0; i < finalContent.length; i += chunkSize) {
                    chunks.push(finalContent.substring(i, i + chunkSize));
                }

                // 3. 預留 Embedding 空間 (未來串接 RAG 時，在此呼叫 Ollama Embedding API 換取真实向量)
                const dummyEmbedding = new Array(768).fill(0.0);

                const chunkEntities = chunks.map(text => ({
                    documentId: documentEntity._id,
                    textSegment: text,
                    embedding: dummyEmbedding,
                    metadata: {
                        guildId: fileInfo.guildId || 'system',
                        channelId: fileInfo.channelId || 'system',
                        fileName: fileInfo.name
                    }
                }));

                // 4. 批次寫入真實的 ChunkModel
                await ChunkModel.insertMany(chunkEntities);

                // 5. 更新文件主體狀態為完成
                documentEntity.parsedContent = finalContent;
                documentEntity.ragStatus = 'completed';
                documentEntity.chunkCount = chunks.length;
                await documentEntity.save();

                console.log(`[RAG_Pipeline_Success] 文件 [${fileInfo.name}] 已成功切片並注入向量庫。`);
            } catch (pipelineErr) {
                console.error(`[RAG_Pipeline_Failed]`, pipelineErr);
                documentEntity.ragStatus = 'failed';
                await documentEntity.save().catch(e => console.error(e));
            }
        })();

        return documentEntity;
    },

    /**
     * 獲取所有文件清單 (排除大體積內文以優化傳輸)
     */
    async getAllDocuments() {
        return await DocumentModel.find().select('-parsedContent').sort({ createdAt: -1 });
    },

    /**
     * 物理連鎖刪除文件與其所屬的所有 RAG 切片
     */
    async deleteDocumentAndChunks(docId) {
        const targetDoc = await DocumentModel.findByIdAndDelete(docId);
        if (targetDoc) {
            // 安全防線：將依附在該文件 ID 下的所有向量切片徹底清空，防止垃圾資料殘留
            await ChunkModel.deleteMany({ documentId: docId });
        }
        return targetDoc;
    }
};