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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from .core.database import init_db
from .core.config import settings
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

# 自定義 CORS Middleware (在 DEBUG 模式下允許所有來源)
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 處理 preflight 請求
        if request.method == "OPTIONS":
            origin = request.headers.get("origin")
            response = JSONResponse(content={}, status_code=200)
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Methods"] = "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"
            response.headers["Access-Control-Allow-Headers"] = request.headers.get("access-control-request-headers", "*")
            response.headers["Access-Control-Max-Age"] = "600"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response

        # 處理實際請求
        response = await call_next(request)
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
        return response

# CORS 設定
if settings.DEBUG:
    logger.info("Running in DEBUG mode - using custom CORS middleware to allow all origins")
    app.add_middleware(CustomCORSMiddleware)
else:
    logger.info(f"CORS allowed origins: {settings.ALLOWED_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
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


@app.get("/debug/cors")
async def debug_cors():
    """調試 CORS 設定"""
    return {
        "debug_mode": settings.DEBUG,
        "allowed_origins": settings.ALLOWED_ORIGINS,
        "cors_config": "allow_origin_regex=.*" if settings.DEBUG else f"allow_origins={settings.ALLOWED_ORIGINS}"
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
