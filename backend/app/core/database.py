"""
資料庫連接配置 - PostgreSQL
"""
from typing import Generator
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
import logging
import os

from .config import settings

logger = logging.getLogger(__name__)

# 全域連接池
_connection_pool = None


def get_connection_pool():
    """取得資料庫連接池"""
    global _connection_pool
    if _connection_pool is None:
        try:
            _connection_pool = SimpleConnectionPool(
                minconn=1,
                maxconn=settings.DB_POOL_SIZE,
                dsn=settings.DATABASE_URL
            )
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise
    return _connection_pool


def get_db() -> Generator:
    """取得資料庫連接"""
    pool = get_connection_pool()
    conn = None
    try:
        conn = pool.getconn()
        yield conn
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database error: {e}")
        raise e
    finally:
        if conn:
            pool.putconn(conn)


def get_db_cursor() -> Generator:
    """取得資料庫連接和游標（返回字典格式）"""
    pool = get_connection_pool()
    conn = None
    cursor = None
    try:
        conn = pool.getconn()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database error: {e}")
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn:
            pool.putconn(conn)


def init_db():
    """初始化資料庫"""
    try:
        # 建立連接
        conn = psycopg2.connect(settings.DATABASE_URL)
        cursor = conn.cursor()

        logger.info("Initializing database...")

        # 創建 users 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 創建 stocks 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stocks (
                symbol VARCHAR(20) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                exchange VARCHAR(20) DEFAULT 'TWSE',
                market VARCHAR(20) DEFAULT 'TW',
                industry VARCHAR(100),
                sector VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 創建 stock_prices 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_prices (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                date DATE NOT NULL,
                open NUMERIC(12, 2) NOT NULL,
                high NUMERIC(12, 2) NOT NULL,
                low NUMERIC(12, 2) NOT NULL,
                close NUMERIC(12, 2) NOT NULL,
                volume BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,
                UNIQUE(symbol, date)
            )
        """)

        # 創建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol
            ON stock_prices(symbol)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_prices_date
            ON stock_prices(date DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date
            ON stock_prices(symbol, date DESC)
        """)

        # 創建 strategies 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS strategies (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                strategy_type VARCHAR(50) NOT NULL DEFAULT 'moving_average',
                initial_capital NUMERIC(15, 2) NOT NULL DEFAULT 100000,

                -- Moving Average parameters
                short_period INTEGER DEFAULT 5,
                long_period INTEGER DEFAULT 20,

                -- RSI parameters
                rsi_period INTEGER DEFAULT 14,
                rsi_overbought INTEGER DEFAULT 70,
                rsi_oversold INTEGER DEFAULT 30,

                -- MACD parameters
                macd_fast INTEGER DEFAULT 12,
                macd_slow INTEGER DEFAULT 26,
                macd_signal INTEGER DEFAULT 9,

                -- Bollinger Bands parameters
                bb_period INTEGER DEFAULT 20,
                bb_std_dev NUMERIC(5, 2) DEFAULT 2.0,

                -- Grid Trading parameters
                grid_lower_price NUMERIC(12, 2) DEFAULT 0,
                grid_upper_price NUMERIC(12, 2) DEFAULT 0,
                grid_num_grids INTEGER DEFAULT 10,
                grid_investment_per_grid NUMERIC(15, 2) DEFAULT 10000,

                -- Common risk management
                stop_loss_pct NUMERIC(5, 2) DEFAULT 5.0,
                take_profit_pct NUMERIC(5, 2) DEFAULT 10.0,
                position_size_pct NUMERIC(5, 2) DEFAULT 100.0,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # 插入台灣熱門股票
        stocks_data = [
            ('2330.TW', '台積電', 'TWSE', '半導體', '科技'),
            ('2317.TW', '鴻海', 'TWSE', '電子製造', '科技'),
            ('2454.TW', '聯發科', 'TWSE', '半導體', '科技'),
            ('2308.TW', '台達電', 'TWSE', '電子零組件', '科技'),
            ('2882.TW', '國泰金', 'TWSE', '金融控股', '金融'),
            ('2891.TW', '中信金', 'TWSE', '金融控股', '金融'),
            ('2412.TW', '中華電', 'TWSE', '電信服務', '通訊'),
            ('2881.TW', '富邦金', 'TWSE', '金融控股', '金融'),
            ('1301.TW', '台塑', 'TWSE', '塑膠', '傳統產業'),
            ('1303.TW', '南亞', 'TWSE', '塑膠', '傳統產業'),
        ]

        for stock in stocks_data:
            cursor.execute("""
                INSERT INTO stocks (symbol, name, exchange, industry, sector)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (symbol) DO NOTHING
            """, stock)

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Database initialized successfully at {settings.DATABASE_URL}")

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


def close_db():
    """關閉資料庫連接池"""
    global _connection_pool
    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None
        logger.info("Database connection pool closed")
