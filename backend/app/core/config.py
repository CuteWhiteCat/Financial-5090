"""
應用程式配置設定
使用 pydantic-settings 管理環境變數
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union

APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# 優先使用專案根目錄的 .env 文件
ENV_FILE_CANDIDATES = [
    PROJECT_ROOT / ".env",  # 專案根目錄 (優先)
    BACKEND_DIR / ".env",   # backend 目錄 (備用)
]


class Settings(BaseSettings):
    """應用程式設定"""

    # 應用基本設定
    APP_NAME: str = "Trading Strategy Simulator"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # 資料庫設定
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost:5432/trading_simulator"

    # JWT 設定
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS 設定 (可以是逗號分隔的字串或列表)
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """解析 CORS 來源 - 支援逗號分隔的字串或列表"""
        if isinstance(v, str):
            # 從環境變數讀取的逗號分隔字串
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

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

    model_config = SettingsConfigDict(
        env_file=[
            str(path) for path in ENV_FILE_CANDIDATES if path.exists()
        ] or [str(path) for path in ENV_FILE_CANDIDATES],
        case_sensitive=True,
        extra='ignore'  # 忽略 .env 中未定義的欄位 (如 REACT_APP_API_BASE_URL)
    )


# 創建全域設定實例
settings = Settings()
