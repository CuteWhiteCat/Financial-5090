# 投資策略模擬工具 (Trading Strategy Simulator)

一個功能完整的投資策略回測系統，支援台灣股票市場，提供直觀的視覺化介面與強大的策略分析功能。

## 專案特色

- 支援多種技術指標策略（移動平均線、RSI、MACD、布林通道等）
- 即時爬取台灣熱門股票歷史資料
- 專業的 K 線圖與策略買賣點視覺化
- 詳細的回測績效分析（報酬率、夏普比率、最大回撤等）
- 多用戶系統，支援策略保存與分享
- 深色主題設計，提供優質使用體驗

## 技術架構

### 前端
- **框架**: React 18 + TypeScript
- **UI 庫**: Material-UI v5 (支援 Dark Theme)
- **圖表**: TradingView Lightweight Charts
- **狀態管理**: React Query + Zustand
- **動畫**: Framer Motion

### 後端
- **框架**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0 (async)
- **資料庫**: PostgreSQL 15
- **快取**: Redis
- **任務隊列**: Celery
- **資料分析**: pandas, numpy, ta-lib

## 專案結構

```
trading-strategy-simulator/
├── backend/                 # 後端程式碼
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 資料庫模型
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # 業務邏輯
│   │   └── utils/          # 工具函數
│   ├── alembic/            # 資料庫遷移
│   ├── tests/              # 測試
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # 前端程式碼
│   ├── src/
│   │   ├── components/    # React 組件
│   │   ├── pages/         # 頁面
│   │   ├── services/      # API 服務
│   │   ├── hooks/         # 自定義 Hooks
│   │   └── contexts/      # Context Providers
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docs/                  # 文檔
├── database.md           # 資料庫設計文件
├── CLAUDE.md             # 專案需求文件
├── docker-compose.yml    # Docker 編排
└── README.md             # 本文件
```

## 快速開始

### 環境需求

- Docker & Docker Compose
- Node.js 18+ (本地開發)
- Python 3.11+ (本地開發)
- PostgreSQL 15+ (本地開發)

### 使用 Docker (推薦)

1. Clone 專案
```bash
git clone <repository-url>
cd trading-strategy-simulator
```

2. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env 檔案，設定必要的環境變數
```

3. 啟動所有服務
```bash
docker-compose up -d
```

4. 初始化資料庫
```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/init_stocks.py
```

5. 訪問應用
- 前端: http://localhost:3000
- 後端 API: http://localhost:8000
- API 文檔: http://localhost:8000/docs

### 本地開發

#### 後端

```bash
cd backend

# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 設定環境變數
export DATABASE_URL="postgresql://user:password@localhost:5432/trading_db"
export REDIS_URL="redis://localhost:6379"

# 執行資料庫遷移
alembic upgrade head

# 啟動開發伺服器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm start
```

## 主要功能

### 1. 用戶系統
- 用戶註冊與登入
- JWT 認證
- 個人資料管理

### 2. 策略管理
- 建立自定義交易策略
- 支援多種技術指標
- 策略參數調整
- 策略保存與分享

### 3. 回測分析
- 選擇台灣熱門股票
- 設定回測時間範圍
- 設定初始資金
- 即時爬取股票資料
- 執行回測計算

### 4. 結果視覺化
- 專業 K 線圖表
- 策略買賣點標記
- 買入持有策略對比
- 資金曲線圖
- 詳細交易記錄

### 5. 績效指標
- 總報酬率
- 年化報酬率
- 夏普比率
- 最大回撤
- 勝率
- 獲利因子

## API 文檔

完整的 API 文檔可在啟動後端服務後訪問：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

主要端點：
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `GET /api/strategies` - 取得策略列表
- `POST /api/strategies` - 建立新策略
- `POST /api/backtests` - 執行回測
- `GET /api/backtests/{id}/results` - 取得回測結果

## 資料庫設計

詳細的資料庫設計請參考 [database.md](./database.md)

主要資料表：
- `users` - 用戶資料
- `strategies` - 交易策略
- `stocks` - 股票資訊
- `stock_prices` - 股票價格
- `backtests` - 回測任務
- `backtest_results` - 回測結果
- `backtest_transactions` - 交易記錄

## 測試

### 後端測試
```bash
cd backend
pytest tests/ -v --cov=app
```

### 前端測試
```bash
cd frontend
npm test
npm run test:coverage
```

## 部署

### Docker Compose 部署

生產環境建議使用 Docker Compose：

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 環境變數

重要的環境變數：
```env
# 資料庫
DATABASE_URL=postgresql://user:password@postgres:5432/trading_db
POSTGRES_DB=trading_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# API Keys (optional)
FINNHUB_API_KEY=your_api_key
```

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License

## 聯絡方式

如有問題或建議，請開 Issue 或聯絡專案維護者。

---

## 附錄

### 支援的台灣股票

預設支援以下熱門股票：
- 2330.TW - 台積電
- 2317.TW - 鴻海
- 2454.TW - 聯發科
- 2308.TW - 台達電
- 2882.TW - 國泰金
- 2891.TW - 中信金
- 2412.TW - 中華電
- 2881.TW - 富邦金
- 1301.TW - 台塑
- 1303.TW - 南亞

更多股票可透過後台管理介面新增。

### 支援的策略類型

1. **移動平均線策略 (Moving Average)**
   - 金叉死叉
   - 均線多頭排列

2. **RSI 策略**
   - 超買超賣

3. **MACD 策略**
   - 訊號線交叉

4. **布林通道策略 (Bollinger Bands)**
   - 突破上下軌

5. **自定義策略**
   - 組合多個指標
   - 自定義買賣條件

### 效能建議

- 使用 Redis 快取股票資料
- 定期清理過期的回測記錄
- 對大量歷史資料使用分區表
- 使用 Celery 處理耗時的回測任務
- 啟用資料庫連接池

### 安全性建議

- 定期更新依賴套件
- 使用強密碼策略
- 啟用 HTTPS
- 限制 API 請求頻率
- 定期備份資料庫
- 不要在程式碼中硬編碼密鑰

### 監控與日誌

建議整合：
- Prometheus + Grafana (效能監控)
- ELK Stack (日誌分析)
- Sentry (錯誤追蹤)

### 擴展性

系統設計考慮了以下擴展可能：
- 支援更多市場（美股、港股等）
- 加入機器學習策略
- 即時交易模擬
- 社群功能（策略分享、討論）
- 行動版 App
