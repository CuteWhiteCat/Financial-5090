"""
回測相關 API 路由
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import sqlite3
import pandas as pd
from datetime import datetime

from ..core.database import get_db
from ..services.stock_crawler import StockCrawler
from ..services.backtest_engine import BacktestEngine

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


class BacktestRequest(BaseModel):
    """回測請求模型"""
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 100000
    strategy_type: str = "moving_average"

    # Moving Average
    short_period: Optional[int] = 5
    long_period: Optional[int] = 20

    # RSI
    rsi_period: Optional[int] = 14
    rsi_overbought: Optional[int] = 70
    rsi_oversold: Optional[int] = 30

    # MACD
    macd_fast: Optional[int] = 12
    macd_slow: Optional[int] = 26
    macd_signal: Optional[int] = 9

    # Bollinger Bands
    bb_period: Optional[int] = 20
    bb_std_dev: Optional[float] = 2.0

    # Grid Trading
    grid_lower_price: Optional[float] = 0
    grid_upper_price: Optional[float] = 0
    grid_num_grids: Optional[int] = 10
    grid_investment_per_grid: Optional[float] = 10000


@router.post("/run")
async def run_backtest(
    request: BacktestRequest,
    db: sqlite3.Connection = Depends(get_db)
):
    """執行回測"""
    try:
        print(f"\n{'='*60}")
        print(f"Start Backtest")
        print(f"{'='*60}")
        print(f"Symbol: {request.symbol}")
        print(f"Date range: {request.start_date} to {request.end_date}")
        print(f"Initial capital: NT$ {request.initial_capital:,.0f}")
        print(f"Strategy: {request.strategy_type}")

        # 步驟 1: 從資料庫獲取資料
        print(f"\nStep 1: Check database...")
        cursor = db.cursor()
        cursor.execute("""
            SELECT date, open, high, low, close, volume
            FROM stock_prices
            WHERE symbol = ? AND date >= ? AND date <= ?
            ORDER BY date ASC
        """, (request.symbol, request.start_date, request.end_date))

        rows = cursor.fetchall()
        print(f"   Found {len(rows)} records in database")

        # 步驟 2: 如果資料不足，爬取新資料
        if len(rows) < 30:
            print(f"\nStep 2: Insufficient data, fetching...")
            df = StockCrawler.fetch_stock_data(
                request.symbol,
                request.start_date,
                request.end_date
            )

            if df is None or df.empty:
                raise HTTPException(status_code=404, detail="無法獲取股票資料")

            # 存入資料庫
            saved_count = StockCrawler.save_to_db(db, request.symbol, df)
            print(f"   Saved {saved_count} records")

        else:
            print(f"   Using existing database data")
            # 將資料庫資料轉換為 DataFrame
            df = pd.DataFrame(rows, columns=['date', 'open', 'high', 'low', 'close', 'volume'])

        # 步驟 3: 執行回測
        print(f"\nStep 3: Running backtest strategy...")
        engine = BacktestEngine(initial_capital=request.initial_capital)

        if request.strategy_type == "moving_average":
            print(f"   Strategy params: short={request.short_period}days, long={request.long_period}days")
            results = engine.run_ma_strategy(
                df,
                short_period=request.short_period,
                long_period=request.long_period
            )
        elif request.strategy_type == "rsi":
            print(f"   Strategy params: period={request.rsi_period}, overbought={request.rsi_overbought}, oversold={request.rsi_oversold}")
            results = engine.run_rsi_strategy(
                df,
                rsi_period=request.rsi_period,
                rsi_overbought=request.rsi_overbought,
                rsi_oversold=request.rsi_oversold
            )
        elif request.strategy_type == "macd":
            print(f"   Strategy params: fast={request.macd_fast}, slow={request.macd_slow}, signal={request.macd_signal}")
            results = engine.run_macd_strategy(
                df,
                macd_fast=request.macd_fast,
                macd_slow=request.macd_slow,
                macd_signal=request.macd_signal
            )
        elif request.strategy_type == "bollinger_bands":
            print(f"   Strategy params: period={request.bb_period}, std_dev={request.bb_std_dev}")
            results = engine.run_bollinger_bands_strategy(
                df,
                bb_period=request.bb_period,
                bb_std_dev=request.bb_std_dev
            )
        elif request.strategy_type == "grid_trading":
            print(f"   Strategy params: grids={request.grid_num_grids}, range={request.grid_lower_price}-{request.grid_upper_price}, investment per grid={request.grid_investment_per_grid}")
            results = engine.run_grid_trading_strategy(
                df,
                grid_lower_price=request.grid_lower_price,
                grid_upper_price=request.grid_upper_price,
                grid_num_grids=request.grid_num_grids,
                grid_investment_per_grid=request.grid_investment_per_grid
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported strategy type: {request.strategy_type}")

        # 步驟 4: 回傳結果
        print(f"\nBacktest completed!")
        print(f"{'='*60}")
        print(f"Backtest Results Summary")
        print(f"{'='*60}")
        print(f"Initial capital: NT$ {results['initial_capital']:,.0f}")
        print(f"Final value: NT$ {results['final_value']:,.0f}")
        print(f"Total return: {results['total_return']:.2f}%")
        print(f"Buy & hold: {results['buy_hold_return']:.2f}%")
        print(f"Sharpe ratio: {results['sharpe_ratio']:.2f}")
        print(f"Max drawdown: {results['max_drawdown']:.2f}%")
        print(f"Total trades: {results['total_trades']}")
        print(f"Win rate: {results['win_rate']:.2f}%")
        print(f"{'='*60}\n")

        return {
            'success': True,
            'message': '回測完成',
            'results': results
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\nBacktest failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"回測執行失敗: {str(e)}")


@router.get("/history")
async def get_backtest_history():
    """取得回測歷史記錄"""
    # TODO: 實作回測歷史記錄功能
    return {
        'message': '功能開發中',
        'history': []
    }
