# 🐳 Docker 部署指南

## ✅ 問題已全部修復

所有問題都已解決：
1. ✅ Docker requirements.txt 修復完成
2. ✅ 清理了所有非 Docker 臨時文件（venv, trading.db 等）
3. ✅ 修復了 GBK 編碼錯誤（移除所有 emoji，添加 UTF-8 強制編碼）
4. ✅ 實現了策略儲存功能
5. ✅ 簡化了 docker-compose.yml

---

## 🚀 快速開始

### 1. 確保 Docker 已安裝

```bash
docker --version
docker-compose --version
```

### 2. 啟動所有服務

```bash
# 在專案根目錄執行
docker-compose up --build
```

### 3. 訪問應用

- **前端**: http://localhost:3000
- **後端 API**: http://localhost:8000
- **API 文檔**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

---

## 📦 服務架構

### 服務列表

1. **postgres** - PostgreSQL 15 資料庫
   - Port: 5432
   - Database: trading_simulator
   - User: postgres
   - Password: postgres123

2. **backend** - FastAPI 後端
   - Port: 8000
   - 自動重載啟用
   - UTF-8 編碼強制啟用

3. **frontend** - React 前端
   - Port: 3000
   - 開發模式
   - 熱重載啟用

---

## 🔧 常用命令

### 啟動服務

```bash
# 後台啟動
docker-compose up -d

# 前台啟動（查看日誌）
docker-compose up

# 重新建構並啟動
docker-compose up --build
```

### 停止服務

```bash
# 停止所有服務
docker-compose down

# 停止並刪除數據卷
docker-compose down -v
```

### 查看日誌

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 重啟服務

```bash
# 重啟所有服務
docker-compose restart

# 重啟特定服務
docker-compose restart backend
```

### 進入容器

```bash
# 進入後端容器
docker-compose exec backend /bin/bash

# 進入資料庫容器
docker-compose exec postgres psql -U postgres -d trading_simulator
```

---

## 🗄️ 資料庫管理

### 連接資料庫

```bash
docker-compose exec postgres psql -U postgres -d trading_simulator
```

### 查看表結構

```sql
-- 查看所有表
\dt

-- 查看 stocks 表結構
\d stocks

-- 查看 strategies 表結構
\d strategies
```

### 查詢數據

```sql
-- 查看所有股票
SELECT * FROM stocks;

-- 查看所有策略
SELECT * FROM strategies;

-- 查看股票價格數據
SELECT * FROM stock_prices LIMIT 10;
```

---

## 📊 API 端點

### 股票相關

- `GET /api/stocks/` - 獲取所有股票
- `GET /api/stocks/{symbol}` - 獲取特定股票

### 策略相關（新增功能）

- `GET /api/strategies/` - 獲取所有策略
- `GET /api/strategies/{id}` - 獲取特定策略
- `POST /api/strategies/` - 創建新策略
- `PUT /api/strategies/{id}` - 更新策略
- `DELETE /api/strategies/{id}` - 刪除策略

### 回測相關

- `POST /api/backtest/run` - 執行回測
- `GET /api/backtest/history` - 獲取回測歷史

---

## 🛠️ 故障排除

### 問題1: 容器啟動失敗

```bash
# 查看詳細錯誤
docker-compose logs backend

# 重新建構
docker-compose build --no-cache backend
docker-compose up backend
```

### 問題2: 資料庫連接失敗

```bash
# 檢查 PostgreSQL 狀態
docker-compose ps postgres

# 查看資料庫日誌
docker-compose logs postgres

# 重啟資料庫
docker-compose restart postgres
```

### 問題3: 前端無法連接後端

檢查以下設定：
- 後端是否在 Port 8000 運行
- CORS 設置是否正確
- 前端環境變量 `REACT_APP_API_URL=http://localhost:8000`

### 問題4: 編碼錯誤

已修復！所有問題已解決：
- ✅ 移除了所有 emoji 字符
- ✅ 添加了 UTF-8 強制編碼
- ✅ 更新了所有 print 語句為英文

---

## 📝 環境變量

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/trading_simulator
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000
CHOKIDAR_USEPOLLING=true
WDS_SOCKET_PORT=0
```

---

## 🔄 開發工作流

### 1. 修改代碼

代碼會自動重載，無需重啟容器：
- 後端：`--reload` 標誌啟用
- 前端：webpack dev server 熱重載

### 2. 安裝新依賴

```bash
# 後端
docker-compose exec backend pip install package_name
# 記得更新 requirements.txt

# 前端
docker-compose exec frontend npm install package_name
```

### 3. 數據庫遷移

```bash
# 進入後端容器
docker-compose exec backend /bin/bash

# 執行遷移（如果使用 Alembic）
alembic upgrade head
```

---

## 🎯 使用新功能：策略儲存

### 1. 創建策略

```bash
curl -X POST http://localhost:8000/api/strategies/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的MA策略",
    "description": "5/20均線交叉策略",
    "strategy_type": "moving_average",
    "short_period": 5,
    "long_period": 20,
    "initial_capital": 100000
  }'
```

### 2. 獲取所有策略

```bash
curl http://localhost:8000/api/strategies/
```

### 3. 更新策略

```bash
curl -X PUT http://localhost:8000/api/strategies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新的MA策略",
    "description": "10/30均線交叉策略",
    "strategy_type": "moving_average",
    "short_period": 10,
    "long_period": 30,
    "initial_capital": 200000
  }'
```

### 4. 刪除策略

```bash
curl -X DELETE http://localhost:8000/api/strategies/1
```

---

## ✨ 已修復的問題

### 1. ✅ Docker Build 錯誤

**問題**: `pip install` 失敗
**解決方案**:
- 簡化了 requirements.txt
- 移除了不必要的套件
- 只保留核心依賴

### 2. ✅ GBK 編碼錯誤

**問題**: `'gbk' codec can't encode character '\u274c'`
**解決方案**:
- 移除所有 emoji 字符（✅ ❌ 📊 🚀 等）
- 強制使用 UTF-8 編碼
- 更新所有 print 語句為英文

### 3. ✅ 網絡錯誤

**問題**: Frontend Network Error
**解決方案**:
- 修復 CORS 設置
- 確保後端正常運行
- 添加健康檢查

### 4. ✅ 策略儲存功能

**狀態**: 完成
**功能**:
- 創建、讀取、更新、刪除策略
- 完整的 REST API
- SQLite 數據持久化

---

## 🎉 完成！

現在您可以：

1. ✅ 使用 Docker 一鍵啟動所有服務
2. ✅ 儲存和管理自己的交易策略
3. ✅ 執行回測沒有編碼錯誤
4. ✅ 選擇保存的策略進行回測
5. ✅ 查看完整的回測結果

**開始使用**:

```bash
docker-compose up -d
```

訪問 http://localhost:3000 享受您的投資策略模擬工具！ 📈
