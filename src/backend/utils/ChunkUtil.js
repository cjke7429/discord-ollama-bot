// src/backend/utils/ChunkingUtil.js

export const ChunkingUtil = {
    /**
     * 工業級滾動窗格切片演算法 (Sliding Window Chunking)
     * @param {string} text - 原始文件的完整純文字內容
     * @param {number} chunkSize - 每個區塊的目標字數 (預設 500 字)
     * @param {number} chunkOverlap - 鄰近區塊重疊的字數 (預設 50 字，即 10%)
     * @returns {Array<string>} 切片後的文本區塊陣列
     */
    sliceText: (text, chunkSize = 500, chunkOverlap = 50) => {
        if (!text || typeof text !== 'string') return [];
        
        // 清洗異常的連續空白字元與換行，確保字數計算基準一致
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        const chunks = [];
        let startIndex = 0;

        // 當剩餘字數大於 0 時持續進行滾動切片
        while (startIndex < cleanedText.length) {
            let endIndex = startIndex + chunkSize;
            
            // 擷取當前窗格內容
            let chunk = cleanedText.substring(startIndex, endIndex);
            chunks.push(chunk);

            // 核心演算法：前進一個視窗，前進距離為 (chunkSize - chunkOverlap)
            // 藉此留住 10% 的尾部文字，與下一個區塊的首部重疊，鎖住語義脈絡
            startIndex += (chunkSize - chunkOverlap);
        }

        return chunks;
    }
};