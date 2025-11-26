# 投資策略模擬工具 - 資料庫設計文件

## 專案架構優化設計

### 系統架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                         前端層 (React)                       │
│  - Material-UI / Ant Design (Dark Theme)                   │
│  - Recharts / TradingView Lightweight Charts               │
│  - React Router (路由管理)                                  │
│  - React Query (狀態管理與快取)                             │
│  - Framer Motion (動畫)                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓ REST API / WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    後端層 (FastAPI)                          │
│  - 認證模組 (JWT Token)                                     │
│  - 策略引擎 (Strategy Engine)                               │
│  - 股票資料爬蟲 (yfinance)                                  │
│  - 回測引擎 (Backtesting Engine)                            │
│  - 資料分析 (Pandas, NumPy, TA-Lib)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────┐
│                   資料庫層 (PostgreSQL)                      │
│  - 用戶資料                                                  │
│  - 策略配置                                                  │
│  - 回測結果                                                  │
│  - 股票快取資料                                              │
└─────────────────────────────────────────────────────────────┘
```

### 技術棧優化建議

#### 前端
- **UI Framework**: Material-UI (MUI) v5 - 內建 Dark Theme，組件豐富
- **圖表庫**: TradingView Lightweight Charts - 專業金融圖表，效能優異
  - 備選: Recharts (更簡單但功能較少)
- **狀態管理**: React Query + Zustand
  - React Query: 處理伺服器狀態、快取、自動重試
  - Zustand: 輕量級本地狀態管理
- **動畫**: Framer Motion - 宣告式動畫，易於使用
- **表單驗證**: React Hook Form + Zod

#### 後端
- **Web框架**: FastAPI (異步支援，自動生成API文檔)
- **ORM**: SQLAlchemy 2.0 (async支援)
- **認證**: FastAPI-Users 或 自建JWT系統
- **任務隊列**: Celery + Redis (處理耗時的爬蟲與回測任務)
- **快取**: Redis (股票資料快取，減少API請求)
- **資料分析**:
  - pandas: 資料處理
  - numpy: 數值計算
  - ta-lib 或 pandas-ta: 技術指標計算

#### 資料庫
- **主資料庫**: PostgreSQL 14+
- **快取層**: Redis
- **連接池**: pgbouncer (可選，提升效能)

---

## 資料庫 ER Diagram

### 實體關聯圖 (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ STRATEGIES : creates
    USERS ||--o{ BACKTESTS : runs
    STRATEGIES ||--o{ BACKTESTS : uses
    BACKTESTS ||--|| BACKTEST_RESULTS : has
    BACKTESTS ||--o{ BACKTEST_TRANSACTIONS : contains
    STOCKS ||--o{ BACKTESTS : analyzes
    STOCKS ||--o{ STOCK_PRICES : has

    USERS {
        id PK
        email UK
        username UK
        hashed_password
        full_name
        created_at
        updated_at
        is_active
        is_verified
    }

    STRATEGIES {
        id PK
        user_id FK
        name
        description
        parameters
        strategy_type
        created_at
        updated_at
        is_public
    }

    STOCKS {
        symbol PK
        name
        exchange
        market
        industry
        sector
        is_active
        created_at
        updated_at
    }

    STOCK_PRICES {
        id PK
        symbol FK
        open
        high
        low
        close
        adjusted_close
        volume
        created_at
    }

    BACKTESTS {
        id PK
        user_id FK
        strategy_id FK
        stock_symbol FK
        start_date
        end_date
        initial_capital
        strategy_params
        status
        created_at
        completed_at
    }

    BACKTEST_RESULTS {
        id PK
        backtest_id FK
        final_value
        total_return
        annual_return
        sharpe_ratio
        max_drawdown
        win_rate
        total_trades
        winning_trades
        losing_trades
        performance_metrics
        equity_curve
        created_at
    }

    BACKTEST_TRANSACTIONS {
        id PK
        backtest_id FK
        transaction_date
        action
        price
        quantity
        total_amount
        position_size
        signal_reason
        created_at
    }
```

---

## 資料表詳細設計

### 1. Users (用戶表)

用於存儲使用者帳號資訊。

```sql
CREATE TABLE users (
    id PRIMARY KEY DEFAULT gen_random_),
    email 255) UNIQUE NOT NULL,
    username 50) UNIQUE NOT NULL,
    hashed_password 255) NOT NULL,
    full_name 100),
    created_at WITH TIME ZONE DEFAULT CURRENT_
    updated_at WITH TIME ZONE DEFAULT CURRENT_
    is_active DEFAULT TRUE,
    is_verified DEFAULT FALSE,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**欄位說明**:
- `id`: 主鍵，使用 提升安全性
- `email`: 電子郵件，唯一約束
- `username`: 使用者名稱，唯一約束
- `hashed_password`: 加密後的密碼 (使用 bcrypt)
- `is_active`: 帳號是否啟用
- `is_verified`: 電子郵件是否已驗證

---

### 2. Strategies (策略表)

儲存使用者定義的交易策略。

```sql
CREATE TYPE strategy_type_enum AS ENUM (
    'moving_average',
    'rsi',
    'macd',
    'bollinger_bands',
    'custom'
);

CREATE TABLE strategies (
    id PRIMARY KEY DEFAULT gen_random_),
    user_id NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name 100) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    strategy_type strategy_type_enum NOT NULL,
    created_at WITH TIME ZONE DEFAULT CURRENT_
    updated_at WITH TIME ZONE DEFAULT CURRENT_
    is_public DEFAULT FALSE,

    CONSTRAINT unique_user_strategy_name UNIQUE(user_id, name)
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_type ON strategies(strategy_type);
CREATE INDEX idx_strategies_public ON strategies(is_public) WHERE is_public = TRUE;
```

**JSONB parameters 範例**:
```json
{
    "moving_average": {
        "short_period": 5,
        "long_period": 20,
        "signal_type": "crossover"
    },
    "buy_conditions": {
        "price_above_ma": true,
        "rsi_threshold": 30
    },
    "sell_conditions": {
        "price_below_ma": true,
        "rsi_threshold": 70
    },
    "risk_management": {
        "stop_loss_percentage": 5.0,
        "take_profit_percentage": 10.0,
        "position_size_percentage": 100
    }
}
```

---

### 3. Stocks (股票表)

儲存台灣股票的基本資訊。

```sql
CREATE TABLE stocks (
    symbol 20) PRIMARY KEY,
    name 100) NOT NULL,
    exchange 20) DEFAULT 'TWSE',
    market 20) DEFAULT 'TW',
    industry 100),
    sector 100),
    is_active DEFAULT TRUE,
    created_at WITH TIME ZONE DEFAULT CURRENT_
    updated_at WITH TIME ZONE DEFAULT CURRENT_);

CREATE INDEX idx_stocks_industry ON stocks(industry);
CREATE INDEX idx_stocks_sector ON stocks(sector);
CREATE INDEX idx_stocks_active ON stocks(is_active) WHERE is_active = TRUE;
```

**台灣熱門股票預設資料**:
```sql
INSERT INTO stocks (symbol, name, exchange, industry, sector) VALUES
    ('2330.TW', '台積電', 'TWSE', '半導體', '科技'),
    ('2317.TW', '鴻海', 'TWSE', '電子製造', '科技'),
    ('2454.TW', '聯發科', 'TWSE', '半導體', '科技'),
    ('2308.TW', '台達電', 'TWSE', '電子零組件', '科技'),
    ('2882.TW', '國泰金', 'TWSE', '金融控股', '金融'),
    ('2891.TW', '中信金', 'TWSE', '金融控股', '金融'),
    ('2412.TW', '中華電', 'TWSE', '電信服務', '通訊'),
    ('2881.TW', '富邦金', 'TWSE', '金融控股', '金融'),
    ('1301.TW', '台塑', 'TWSE', '塑膠', '傳統產業'),
    ('1303.TW', '南亞', 'TWSE', '塑膠', '傳統產業');
```

---

### 4. Stock Prices (股票價格表)

儲存股票歷史價格資料。

```sql
CREATE TABLE stock_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol 20) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
     DATE NOT NULL,
    open 12, 2) NOT NULL,
    high 12, 2) NOT NULL,
    low 12, 2) NOT NULL,
    close 12, 2) NOT NULL,
    adjusted_close 12, 2),
    volume NOT NULL,
    created_at WITH TIME ZONE DEFAULT CURRENT_

    CONSTRAINT unique_stock_date UNIQUE(symbol, ),
    CONSTRAINT valid_prices CHECK (high >= low AND high >= open AND high >= close AND low <= open AND low <= close)
);

CREATE INDEX idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX idx_stock_prices_date ON stock_prices( DESC);
CREATE INDEX idx_stock_prices_symbol_date ON stock_prices(symbol,  DESC);
```

**優化說明**:
- 使用複合索引加速按股票查詢特定日期範圍
- 價格驗證約束確保資料合理性
- `adjusted_close` 用於考慮股票分割、配息等調整

---

### 5. Backtests (回測表)

儲存回測任務的基本資訊。

```sql
CREATE TYPE backtest_status_enum AS ENUM (
    'pending',
    'running',
    'completed',
    'failed'
);

CREATE TABLE backtests (
    id PRIMARY KEY DEFAULT gen_random_),
    user_id NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id NOT NULL REFERENCES strategies(id) ON DELETE RESTRICT,
    stock_symbol 20) NOT NULL REFERENCES stocks(symbol) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital 15, 2) NOT NULL DEFAULT 100000,
    strategy_params JSONB NOT NULL,
    status backtest_status_enum DEFAULT 'pending',
    created_at WITH TIME ZONE DEFAULT CURRENT_
    completed_at WITH TIME ZONE,

    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_capital CHECK (initial_capital > 0)
);

CREATE INDEX idx_backtests_user_id ON backtests(user_id);
CREATE INDEX idx_backtests_strategy_id ON backtests(strategy_id);
CREATE INDEX idx_backtests_stock_symbol ON backtests(stock_symbol);
CREATE INDEX idx_backtests_status ON backtests(status);
CREATE INDEX idx_backtests_created_at ON backtests(created_at DESC);
```

---

### 6. Backtest Results (回測結果表)

儲存回測的績效指標。

```sql
CREATE TABLE backtest_results (
    id PRIMARY KEY DEFAULT gen_random_),
    backtest_id UNIQUE NOT NULL REFERENCES backtests(id) ON DELETE CASCADE,
    final_value 15, 2) NOT NULL,
    total_return 10, 4) NOT NULL,
    annual_return 10, 4),
    sharpe_ratio 10, 4),
    max_drawdown 10, 4),
    win_rate 5, 2),
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    performance_metrics JSONB,
    equity_curve JSONB,
    created_at WITH TIME ZONE DEFAULT CURRENT_

    CONSTRAINT valid_trades CHECK (winning_trades + losing_trades <= total_trades)
);

CREATE INDEX idx_backtest_results_backtest_id ON backtest_results(backtest_id);
```

**performance_metrics JSONB 範例**:
```json
{
    "volatility": 0.25,
    "sortino_ratio": 1.8,
    "calmar_ratio": 2.5,
    "average_win": 150.50,
    "average_loss": -80.25,
    "profit_factor": 2.1,
    "max_consecutive_wins": 5,
    "max_consecutive_losses": 3,
    "average_trade_duration_days": 7.5
}
```

**equity_curve JSONB 範例**:
```json
{
    "dates": ["2024-01-01", "2024-01-02", "2024-01-03"],
    "strategy_values": [100000, 101500, 103200],
    "buy_hold_values": [100000, 100800, 102100],
    "drawdown_values": [0, -0.5, -1.2]
}
```

---

### 7. Backtest Transactions (回測交易記錄表)

儲存回測過程中的每筆交易。

```sql
CREATE TYPE transaction_action_enum AS ENUM ('buy', 'sell');

CREATE TABLE backtest_transactions (
    id BIGSERIAL PRIMARY KEY,
    backtest_id NOT NULL REFERENCES backtests(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    action transaction_action_enum NOT NULL,
    price 12, 2) NOT NULL,
    quantity 12, 4) NOT NULL,
    total_amount 15, 2) NOT NULL,
    position_size 12, 4) NOT NULL,
    signal_reason TEXT,
    created_at WITH TIME ZONE DEFAULT CURRENT_

    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_price CHECK (price > 0)
);

CREATE INDEX idx_backtest_transactions_backtest_id ON backtest_transactions(backtest_id);
CREATE INDEX idx_backtest_transactions_date ON backtest_transactions(transaction_date);
CREATE INDEX idx_backtest_transactions_action ON backtest_transactions(action);
```

**欄位說明**:
- `signal_reason`: 記錄觸發買賣的原因，例如 "MA5 crossed above MA20"
- `position_size`: 交易後的總持倉數量
- `total_amount`: 交易總金額 (含手續費)

---

## 資料庫優化與索引策略

### 效能優化

1. **分區表** (Partitioning):
```sql
-- 將 stock_prices 按日期分區 (適用於大量歷史資料)
CREATE TABLE stock_prices (
    -- ... 欄位定義
) PARTITION BY RANGE ();

CREATE TABLE stock_prices_2024 PARTITION OF stock_prices
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE stock_prices_2023 PARTITION OF stock_prices
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
```

2. **物化視圖** (Materialized Views):
```sql
-- 建立常用查詢的物化視圖
CREATE MATERIALIZED VIEW mv_user_strategy_summary AS
SELECT
    u.id as user_id,
    u.username,
    COUNT(DISTINCT s.id) as total_strategies,
    COUNT(DISTINCT b.id) as total_backtests,
    AVG(br.total_return) as avg_return,
    MAX(br.total_return) as best_return
FROM users u
LEFT JOIN strategies s ON u.id = s.user_id
LEFT JOIN backtests b ON u.id = b.user_id
LEFT JOIN backtest_results br ON b.id = br.backtest_id
GROUP BY u.id, u.username;

CREATE UNIQUE INDEX idx_mv_user_summary ON mv_user_strategy_summary(user_id);

-- 定期更新
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_strategy_summary;
```

3. **JSONB 索引**:
```sql
-- 為 JSONB 欄位建立 GIN 索引以加速查詢
CREATE INDEX idx_strategies_parameters ON strategies USING GIN (parameters);
CREATE INDEX idx_backtest_results_metrics ON backtest_results USING GIN (performance_metrics);
```

---

## 資料庫初始化腳本

### init.sql

```sql
-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 建立 ENUM 類型
CREATE TYPE strategy_type_enum AS ENUM (
    'moving_average',
    'rsi',
    'macd',
    'bollinger_bands',
    'custom'
);

CREATE TYPE backtest_status_enum AS ENUM (
    'pending',
    'running',
    'completed',
    'failed'
);

CREATE TYPE transaction_action_enum AS ENUM ('buy', 'sell');

-- 建立 updated_at 自動更新函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 建立所有資料表 (按上述 SQL 順序)
-- ...

-- 為需要自動更新 updated_at 的表建立觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## API 端點設計建議

### 認證相關
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `POST /api/auth/refresh` - 刷新 Token
- `GET /api/auth/me` - 取得當前用戶資訊

### 策略相關
- `GET /api/strategies` - 取得策略列表
- `POST /api/strategies` - 建立新策略
- `GET /api/strategies/{id}` - 取得策略詳情
- `PUT /api/strategies/{id}` - 更新策略
- `DELETE /api/strategies/{id}` - 刪除策略

### 股票相關
- `GET /api/stocks` - 取得股票列表
- `GET /api/stocks/{symbol}` - 取得股票詳情
- `GET /api/stocks/{symbol}/prices` - 取得股票歷史價格

### 回測相關
- `POST /api/backtests` - 建立回測任務
- `GET /api/backtests` - 取得回測列表
- `GET /api/backtests/{id}` - 取得回測詳情
- `GET /api/backtests/{id}/results` - 取得回測結果
- `GET /api/backtests/{id}/transactions` - 取得交易記錄
- `DELETE /api/backtests/{id}` - 刪除回測

---

## 前端頁面設計建議

### 主要頁面
1. **登入/註冊頁面** (`/auth`)
2. **儀表板** (`/dashboard`) - 顯示用戶概覽、最近回測
3. **策略管理** (`/strategies`) - 建立、編輯、刪除策略
4. **回測頁面** (`/backtest`) - 選擇股票、設定參數、執行回測
5. **結果分析** (`/backtest/:id/results`) - 顯示詳細回測結果與圖表
6. **歷史記錄** (`/history`) - 查看過去所有回測記錄

### UI 組件建議
- **Chart Component**: 使用 TradingView Lightweight Charts
  - 顯示股價 K 線圖
  - 疊加策略買賣點標記
  - 顯示買入持有策略對比
- **Strategy Builder**: 拖曳式策略建構器
- **Performance Metrics Card**: 顯示回測指標卡片
- **Transaction Table**: 交易記錄表格

---

## Docker 部署建議

### docker-compose.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: trading_simulator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:your_password@postgres:5432/trading_simulator
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## 資料庫遷移管理

建議使用 **Alembic** 進行資料庫版本控制。

```bash
# 初始化 Alembic
alembic init alembic

# 建立遷移
alembic revision --autogenerate -m "Initial migration"

# 執行遷移
alembic upgrade head

# 回滾
alembic downgrade -1
```

---

## 安全性考量

1. **密碼加密**: 使用 bcrypt 或 argon2
2. **SQL 注入防護**: 使用 SQLAlchemy 參數化查詢
3. **JWT Token**: 設定合理的過期時間
4. **CORS 設定**: 限制允許的來源
5. **Rate Limiting**: 使用 slowapi 或 FastAPI-Limiter
6. **敏感資料**: 使用環境變數，不要硬編碼

---

## 效能監控建議

1. **資料庫查詢優化**:
   - 使用 `EXPLAIN ANALYZE` 分析慢查詢
   - 定期執行 `VACUUM` 和 `ANALYZE`

2. **快取策略**:
   - Redis 快取股票價格資料 (TTL: 1天)
   - 快取常用查詢結果

3. **非同步處理**:
   - 使用 Celery 處理耗時的回測任務
   - WebSocket 即時推送回測進度

4. **日誌記錄**:
   - 使用 structlog 記錄結構化日誌
   - 整合 ELK Stack 或 Prometheus + Grafana

---

## 測試建議

### 後端測試
```python
# 使用 pytest + pytest-asyncio
# tests/test_strategies.py

import pytest
from fastapi.testclient import TestClient

def test_create_strategy(client: TestClient, auth_headers):
    response = client.post(
        "/api/strategies",
        json={
            "name": "MA Crossover",
            "strategy_type": "moving_average",
            "parameters": {"short_period": 5, "long_period": 20}
        },
        headers=auth_headers
    )
    assert response.status_code == 201
```

### 前端測試
```javascript
// 使用 Jest + React Testing Library
// src/__tests__/StrategyForm.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import StrategyForm from '../components/StrategyForm';

test('submits strategy form', async () => {
  render(<StrategyForm />);

  fireEvent.change(screen.getByLabelText('Strategy Name'), {
    target: { value: 'My Strategy' }
  });

  fireEvent.click(screen.getByText('Create Strategy'));

  await waitFor(() => {
    expect(screen.getByText('Strategy created')).toBeInTheDocument();
  });
});
```

---

## 總結

此設計提供了：
1. **完整的 ER Diagram** - 涵蓋所有核心功能
2. **優化的資料庫架構** - 考慮效能、擴展性、資料完整性
3. **詳細的 API 設計** - RESTful 風格，清晰的端點
4. **技術棧建議** - 現代、穩定、效能優異的技術選擇
5. **部署方案** - Docker 容器化，易於部署
6. **安全性與效能** - 完善的安全措施與效能優化策略

這個設計可以支撐中等規模的用戶量，並具備良好的擴展性。
