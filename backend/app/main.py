# -*- coding: utf-8 -*-
"""
FastAPI Main Application
Trading Strategy Simulator Backend
"""
import sys
import io

# Force UTF-8 encoding for stdout/stderr
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .core.database import init_db
from .api import stocks, backtest, strategies, auth

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 創建 FastAPI 應用
app = FastAPI(
    title="Trading Strategy Simulator API",
    description="投資策略模擬工具 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 設定
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(stocks.router)
app.include_router(backtest.router)
app.include_router(strategies.router)

# 啟動時初始化資料庫
@app.on_event("startup")
async def startup_event():
    """應用啟動時執行"""
    logger.info("Application starting...")
    init_db()
    logger.info("Database initialized successfully")


@app.get("/")
async def root():
    """根路由"""
    return {
        "message": "Trading Strategy Simulator API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "service": "Trading Strategy Simulator"
    }


@app.get("/api/v1/info")
async def api_info():
    """API 資訊"""
    return {
        "api_version": "v1",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "auth": "/api/v1/auth",
            "strategies": "/api/v1/strategies",
            "stocks": "/api/v1/stocks",
            "backtests": "/api/v1/backtests"
        }
    }


# 錯誤處理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
