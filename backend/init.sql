-- 投資策略模擬工具 - 資料庫初始化腳本
-- PostgreSQL 15+

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
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
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Users 表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Stocks 表
CREATE TABLE IF NOT EXISTS stocks (
    symbol VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    exchange VARCHAR(20) DEFAULT 'TWSE',
    market VARCHAR(20) DEFAULT 'TW',
    industry VARCHAR(100),
    sector VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stocks_industry ON stocks(industry);
CREATE INDEX idx_stocks_sector ON stocks(sector);
CREATE INDEX idx_stocks_active ON stocks(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Strategies 表
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    strategy_type strategy_type_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_user_strategy_name UNIQUE(user_id, name)
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_type ON strategies(strategy_type);
CREATE INDEX idx_strategies_public ON strategies(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_strategies_parameters ON strategies USING GIN (parameters);

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Stock Prices 表
CREATE TABLE IF NOT EXISTS stock_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    date DATE NOT NULL,
    open NUMERIC(12, 2) NOT NULL,
    high NUMERIC(12, 2) NOT NULL,
    low NUMERIC(12, 2) NOT NULL,
    close NUMERIC(12, 2) NOT NULL,
    adjusted_close NUMERIC(12, 2),
    volume BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_stock_date UNIQUE(symbol, date),
    CONSTRAINT valid_prices CHECK (high >= low AND high >= open AND high >= close AND low <= open AND low <= close)
);

CREATE INDEX idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX idx_stock_prices_date ON stock_prices(date DESC);
CREATE INDEX idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC);

-- 5. Backtests 表
CREATE TABLE IF NOT EXISTS backtests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE RESTRICT,
    stock_symbol VARCHAR(20) NOT NULL REFERENCES stocks(symbol) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital NUMERIC(15, 2) NOT NULL DEFAULT 100000,
    strategy_params JSONB NOT NULL,
    status backtest_status_enum DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_capital CHECK (initial_capital > 0)
);

CREATE INDEX idx_backtests_user_id ON backtests(user_id);
CREATE INDEX idx_backtests_strategy_id ON backtests(strategy_id);
CREATE INDEX idx_backtests_stock_symbol ON backtests(stock_symbol);
CREATE INDEX idx_backtests_status ON backtests(status);
CREATE INDEX idx_backtests_created_at ON backtests(created_at DESC);

-- 6. Backtest Results 表
CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backtest_id UUID UNIQUE NOT NULL REFERENCES backtests(id) ON DELETE CASCADE,
    final_value NUMERIC(15, 2) NOT NULL,
    total_return NUMERIC(10, 4) NOT NULL,
    annual_return NUMERIC(10, 4),
    sharpe_ratio NUMERIC(10, 4),
    max_drawdown NUMERIC(10, 4),
    win_rate NUMERIC(5, 2),
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    performance_metrics JSONB,
    equity_curve JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_trades CHECK (winning_trades + losing_trades <= total_trades)
);

CREATE INDEX idx_backtest_results_backtest_id ON backtest_results(backtest_id);
CREATE INDEX idx_backtest_results_metrics ON backtest_results USING GIN (performance_metrics);

-- 7. Backtest Transactions 表
CREATE TABLE IF NOT EXISTS backtest_transactions (
    id BIGSERIAL PRIMARY KEY,
    backtest_id UUID NOT NULL REFERENCES backtests(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    action transaction_action_enum NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    position_size NUMERIC(12, 4) NOT NULL,
    signal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_price CHECK (price > 0)
);

CREATE INDEX idx_backtest_transactions_backtest_id ON backtest_transactions(backtest_id);
CREATE INDEX idx_backtest_transactions_date ON backtest_transactions(transaction_date);
CREATE INDEX idx_backtest_transactions_action ON backtest_transactions(action);

-- 插入預設台灣熱門股票資料
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
    ('1303.TW', '南亞', 'TWSE', '塑膠', '傳統產業')
ON CONFLICT (symbol) DO NOTHING;

-- 建立物化視圖：用戶策略摘要
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_strategy_summary AS
SELECT
    u.id as user_id,
    u.username,
    COUNT(DISTINCT s.id) as total_strategies,
    COUNT(DISTINCT b.id) as total_backtests,
    COALESCE(AVG(br.total_return), 0) as avg_return,
    COALESCE(MAX(br.total_return), 0) as best_return,
    COALESCE(MIN(br.total_return), 0) as worst_return
FROM users u
LEFT JOIN strategies s ON u.id = s.user_id
LEFT JOIN backtests b ON u.id = b.user_id AND b.status = 'completed'
LEFT JOIN backtest_results br ON b.id = br.backtest_id
GROUP BY u.id, u.username;

CREATE UNIQUE INDEX idx_mv_user_summary ON mv_user_strategy_summary(user_id);

-- 授予權限 (根據需要調整用戶名)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- 完成訊息
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
    RAISE NOTICE 'Created tables: users, stocks, strategies, stock_prices, backtests, backtest_results, backtest_transactions';
    RAISE NOTICE 'Inserted % default stocks', (SELECT COUNT(*) FROM stocks);
END $$;
