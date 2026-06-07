import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiRouter } from './routes/ApiRouter.js';
import cors from 'cors';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.use(express.json());
app.use(cors());

// 掛載全域 API 路由根路徑
app.use('/api', ApiRouter);

// 404 路由阻斷防線
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        type: 'route_not_found',
        message: `核心引擎不支援此網路端點: [${req.method}] ${req.url}`
    });
});

if (!process.env.MONGODB_URI) {
    console.error(`[CRITICAL] 啟動失敗：環境變數 MONGODB_URI 未定義。`);
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(`[${new Date().toISOString()}] [BACKEND] MongoDB 連線成功。`);
       app.listen(PORT, '0.0.0.0', () => {
         console.log(`[${new Date().toISOString()}][BACKEND][app.js] [SUCCESS] 後端 API 伺服器已成功於所有 IPv4 介面啟動完成`);
        });
    })
    .catch(err => {
        console.error(`[CRITICAL] MongoDB 連線崩潰:`, err.stack);
        process.exit(1);
    });