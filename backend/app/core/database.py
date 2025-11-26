"""
資料庫連接配置
"""
from typing import Generator
import sqlite3
import os

# 使用 SQLite 作為簡單的資料庫方案
DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "trading.db")


def get_db() -> Generator:
    """取得資料庫連接"""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # 讓結果可以像字典一樣存取
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_db():
    """初始化資料庫"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # 創建 stocks 表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stocks (
            symbol TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            exchange TEXT DEFAULT 'TWSE',
            market TEXT DEFAULT 'TW',
            industry TEXT,
            sector TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 創建 stock_prices 表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stock_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            date DATE NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            volume INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (symbol) REFERENCES stocks(symbol),
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

    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create strategies table with extended parameters
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            strategy_type TEXT NOT NULL DEFAULT 'moving_average',
            initial_capital REAL NOT NULL DEFAULT 100000,

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
            bb_std_dev REAL DEFAULT 2.0,

            -- Grid Trading parameters
            grid_lower_price REAL DEFAULT 0,
            grid_upper_price REAL DEFAULT 0,
            grid_num_grids INTEGER DEFAULT 10,
            grid_investment_per_grid REAL DEFAULT 10000,

            -- Common risk management
            stop_loss_pct REAL DEFAULT 5.0,
            take_profit_pct REAL DEFAULT 10.0,
            position_size_pct REAL DEFAULT 100.0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
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
            INSERT OR IGNORE INTO stocks (symbol, name, exchange, industry, sector)
            VALUES (?, ?, ?, ?, ?)
        """, stock)

    conn.commit()
    conn.close()

    print(f"Database initialized: {DATABASE_PATH}")