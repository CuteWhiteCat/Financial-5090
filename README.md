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
- **資料庫**: PostgreSQL 15
- **資料分析**: pandas, numpy, yfinance

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
│   ├── tests/              # 測試
│   └── requirements.txt
├── frontend/               # 前端程式碼
│   ├── src/
│   │   ├── components/    # React 組件
│   │   ├── pages/         # 頁面
│   │   ├── services/      # API 服務
│   │   ├── hooks/         # 自定義 Hooks
│   │   └── contexts/      # Context Providers
│   ├── public/
│   └── package.json
├── docs/                  # 文檔
├── database.md           # 資料庫設計文件
├── CLAUDE.md             # 專案需求文件
└── README.md             # 本文件
```

## 快速開始

### 環境需求

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### PostgreSQL 設置

#### 1. 安裝 PostgreSQL

**Windows:**

- 下載並安裝 [PostgreSQL](https://www.postgresql.org/download/windows/)
- 安裝時記下設置的 postgres 用戶密碼

**Linux:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### 2. 創建資料庫

```bash
# 切換到 postgres 用戶（Linux/macOS）
sudo -u postgres psql

# 或直接使用 psql（Windows/已設置的系統）
psql -U postgres

# 在 psql 中執行：
CREATE DATABASE trading_simulator;
CREATE USER trading_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE trading_simulator TO trading_user;
\q
```

#### 3. 設置環境變數

建立 `backend/.env` 檔案：

```bash
cd backend
cp .env.example .env
# 編輯 .env 設置你的資料庫連接資訊
```

最少需要設置以下變數：

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/trading_simulator
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
```

其他配置已有預設值，可依需求調整。

### 開始使用

#### 啟動

```bash
# 1) 後端：啟動 API 伺服器
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2) 前端：啟動前端開發伺服器（開新終端）
cd frontend
npm install
npm start
```

完成後端與前端都啟動後，瀏覽器前往 http://localhost:3000 使用介面。

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

本專案包含完整的測試套件，涵蓋單元測試、集成測試和 API 測試。

### 📁 測試結構

```
backend/tests/
├── conftest.py          # Pytest 配置和共享 fixtures
├── unit/                # 單元測試
│   ├── test_security.py         # 安全功能測試
│   └── test_stock_crawler.py    # 股票爬蟲測試
├── integration/         # 集成測試
│   └── test_database.py         # 資料庫測試
└── api/                 # API 端點測試
    ├── test_auth_api.py         # 認證 API
    ├── test_stocks_api.py       # 股票 API
    ├── test_strategies_api.py   # 策略 API
    └── test_backtest_api.py     # 回測 API
```

### 🚀 運行測試

#### 安裝測試依賴

```bash
cd backend
pip install pytest pytest-cov pytest-html
```

#### 運行所有測試

```bash
# 運行所有測試
pytest

# 運行並顯示詳細輸出
pytest -v

# 運行並顯示 print 輸出
pytest -v -s
```

#### 運行特定類型的測試

```bash
# 單元測試
pytest tests/unit/ -v

# API 測試
pytest tests/api/ -v

# 集成測試
pytest tests/integration/ -v
```

#### 運行特定測試文件

```bash
# 認證測試
pytest tests/api/test_auth_api.py -v

# 安全功能測試
pytest tests/unit/test_security.py -v
```

### 📊 測試覆蓋率

生成覆蓋率報告：

```bash
# 生成覆蓋率報告
pytest --cov=app --cov-report=html --cov-report=term

# 查看 HTML 報告
# 打開 htmlcov/index.html
```

### 📝 測試報告

生成 HTML 測試報告：

```bash
pytest --html=report.html --self-contained-html
```

### 🧪 測試範例

#### 單元測試範例

```python
def test_password_hash_generation():
    """測試密碼哈希生成"""
    password = "TestPassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert hashed.startswith("$2b$")
```

#### API 測試範例

```python
def test_login_success(client, test_user_data):
    """測試成功登入"""
    # 註冊
    client.post("/api/auth/register", json=test_user_data)

    # 登入
    response = client.post("/api/auth/login", data={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })

    assert response.status_code == 200
    assert "access_token" in response.json()
```

### 📚 詳細文檔

每個測試目錄都包含詳細的 README 說明：

- [測試總覽](backend/tests/README.md)
- [單元測試說明](backend/tests/unit/README.md)
- [API 測試說明](backend/tests/api/README.md)
- [集成測試說明](backend/tests/integration/README.md)

### 前端測試

```bash
cd frontend
npm test
npm run test:coverage
```

## 部署

### 環境變數

最重要的環境變數（必須設置）：

```env
# 資料庫連接
DATABASE_URL=postgresql://postgres:password@localhost:5432/trading_simulator

# JWT 密鑰（建議使用隨機生成的密鑰）
JWT_SECRET=your_jwt_secret_key
```

其他可選配置（已有預設值）：

```env
# JWT 配置
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS 允許的來源
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# 股票資料配置
STOCK_DATA_CACHE_TTL=86400
MAX_BACKTEST_YEARS=10
DEFAULT_INITIAL_CAPITAL=100000

# 效能設定
MAX_WORKERS=4
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
```

完整的配置範例請參考 `backend/.env.example`