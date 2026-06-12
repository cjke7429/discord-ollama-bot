# 快速佈署

### 確認

先從github pull 下來

加入.env檔案及相關變數(discord bot)



### docker compose啟動

```
// 建立image並啟動container
docker compose -f docker-compose.dev.yml up --build
```


### OLLAMA 安裝模型

```
docker exec -it ollama_container ollama pull gemma4:31b-cloud
docker exec -it ollama_container ollama pull nomic-embed-text
```

### 排錯修正後重啟

```
// 關閉docker compose及建立的image、volumes、containers
docker compose -f docker-compose.dev.yml down --volumes
// 重新啟動
docker compose -f docker-compose.dev.yml up --build
```

### 單獨container操作

```
// 查看單獨container log >> -f表示follow
docker logs -f backend_container 


// 單獨關閉service name為backend:dev >> 並重新開啟
docker compose -f docker-compose.dev.yml down --volumes backend:dev

docker compose -f docker-compose.dev.yml up --build backend:dev
```


### 後端env

```
# =========================================================================
# BACKEND ENVIRONMENT VARIABLES (Location: ./src/backend/.env)
# =========================================================================

# 1. 伺服器通訊埠口設定
PORT=3000

# 2. 資料庫連線字串 (使用 Docker Compose 內部 DNS 域名解析)
MONGODB_URI=mongodb://mongodb_container:27017/database

# 3. 大語言模型
OLLAMA_HOST=http://ollama_container:11434

# 大模型名稱對齊
OLLAMA_MODEL=gemma4:31b-cloud
OLLAMA_EMBED_MODEL=nomic-embed-text
```


### 前端env

```
# =========================================================================
# FRONTEND ENVIRONMENT VARIABLES (Location: ./src/frontend/.env)
# =========================================================================

# 1. Discord 核心資安認證金鑰 (請替換為您在新主機上的實體 Token)
DISCORD_TOKEN=XXXXX

# 3. 後端通訊端點(透過docker compose DNS解析)
BACKEND_API=http://backend:3000
```