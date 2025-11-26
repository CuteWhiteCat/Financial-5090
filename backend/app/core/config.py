"""
應用程式配置設定
使用 pydantic-settings 管理環境變數
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """應用程式設定"""

    # 應用基本設定
    APP_NAME: str = "Trading Strategy Simulator"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # 資料庫設定
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost:5432/trading_simulator"

    # Redis 設定
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT 設定
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS 設定
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ]

    # Celery 設定
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # 股票資料設定
    STOCK_DATA_CACHE_TTL: int = 86400  # 24小時
    MAX_BACKTEST_YEARS: int = 10
    DEFAULT_INITIAL_CAPITAL: float = 100000.0

    # 效能設定
    MAX_WORKERS: int = 4
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # API Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    class Config:
        env_file = ".env"
        case_sensitive = True


# 創建全域設定實例
settings = Settings()
