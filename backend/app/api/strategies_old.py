# -*- coding: utf-8 -*-
"""
Strategy API endpoints - Extended version with multiple strategy types
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime

from ..core.database import get_db
from .auth import get_current_user

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


class StrategyCreate(BaseModel):
    """Create strategy request model"""
    name: str
    description: Optional[str] = ""
    strategy_type: str = "moving_average"
    initial_capital: float = 100000

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

    # Risk Management
    stop_loss_pct: Optional[float] = 5.0
    take_profit_pct: Optional[float] = 10.0
    position_size_pct: Optional[float] = 100.0


class StrategyResponse(BaseModel):
    """Strategy response model"""
    id: int
    name: str
    description: Optional[str]
    strategy_type: str
    initial_capital: float

    # Moving Average
    short_period: Optional[int]
    long_period: Optional[int]

    # RSI
    rsi_period: Optional[int]
    rsi_overbought: Optional[int]
    rsi_oversold: Optional[int]

    # MACD
    macd_fast: Optional[int]
    macd_slow: Optional[int]
    macd_signal: Optional[int]

    # Bollinger Bands
    bb_period: Optional[int]
    bb_std_dev: Optional[float]

    # Grid Trading
    grid_lower_price: Optional[float]
    grid_upper_price: Optional[float]
    grid_num_grids: Optional[int]
    grid_investment_per_grid: Optional[float]

    # Risk Management
    stop_loss_pct: Optional[float]
    take_profit_pct: Optional[float]
    position_size_pct: Optional[float]

    created_at: str


@router.get("/", response_model=List[StrategyResponse])
async def get_strategies(db: sqlite3.Connection = Depends(get_db)):
    """Get all strategies"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT * FROM strategies ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()
        strategies = []

        for row in rows:
            strategy = dict(row)
            strategies.append(strategy)

        return strategies

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(strategy_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Get single strategy by ID"""
    try:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Strategy not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy: {str(e)}")


@router.post("/", response_model=StrategyResponse)
async def create_strategy(strategy: StrategyCreate, db: sqlite3.Connection = Depends(get_db)):
    """Create new strategy"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO strategies (
                name, description, strategy_type, initial_capital,
                short_period, long_period,
                rsi_period, rsi_overbought, rsi_oversold,
                macd_fast, macd_slow, macd_signal,
                bb_period, bb_std_dev,
                grid_lower_price, grid_upper_price, grid_num_grids, grid_investment_per_grid,
                stop_loss_pct, take_profit_pct, position_size_pct
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            strategy.name, strategy.description, strategy.strategy_type, strategy.initial_capital,
            strategy.short_period, strategy.long_period,
            strategy.rsi_period, strategy.rsi_overbought, strategy.rsi_oversold,
            strategy.macd_fast, strategy.macd_slow, strategy.macd_signal,
            strategy.bb_period, strategy.bb_std_dev,
            strategy.grid_lower_price, strategy.grid_upper_price, strategy.grid_num_grids, strategy.grid_investment_per_grid,
            strategy.stop_loss_pct, strategy.take_profit_pct, strategy.position_size_pct
        ))

        strategy_id = cursor.lastrowid
        db.commit()

        # Fetch created strategy
        cursor.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,))
        row = cursor.fetchone()

        return dict(row)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create strategy: {str(e)}")


@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(strategy_id: int, strategy: StrategyCreate, db: sqlite3.Connection = Depends(get_db)):
    """Update existing strategy"""
    try:
        cursor = db.cursor()

        # Check if strategy exists
        cursor.execute("SELECT id FROM strategies WHERE id = ?", (strategy_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Strategy not found")

        # Update strategy
        cursor.execute("""
            UPDATE strategies SET
                name = ?, description = ?, strategy_type = ?, initial_capital = ?,
                short_period = ?, long_period = ?,
                rsi_period = ?, rsi_overbought = ?, rsi_oversold = ?,
                macd_fast = ?, macd_slow = ?, macd_signal = ?,
                bb_period = ?, bb_std_dev = ?,
                grid_lower_price = ?, grid_upper_price = ?, grid_num_grids = ?, grid_investment_per_grid = ?,
                stop_loss_pct = ?, take_profit_pct = ?, position_size_pct = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            strategy.name, strategy.description, strategy.strategy_type, strategy.initial_capital,
            strategy.short_period, strategy.long_period,
            strategy.rsi_period, strategy.rsi_overbought, strategy.rsi_oversold,
            strategy.macd_fast, strategy.macd_slow, strategy.macd_signal,
            strategy.bb_period, strategy.bb_std_dev,
            strategy.grid_lower_price, strategy.grid_upper_price, strategy.grid_num_grids, strategy.grid_investment_per_grid,
            strategy.stop_loss_pct, strategy.take_profit_pct, strategy.position_size_pct,
            strategy_id
        ))

        db.commit()

        # Fetch updated strategy
        cursor.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,))
        row = cursor.fetchone()

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update strategy: {str(e)}")


@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Delete strategy"""
    try:
        cursor = db.cursor()

        # Check if strategy exists
        cursor.execute("SELECT id FROM strategies WHERE id = ?", (strategy_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Strategy not found")

        # Delete strategy
        cursor.execute("DELETE FROM strategies WHERE id = ?", (strategy_id,))
        db.commit()

        return {"success": True, "message": "Strategy deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete strategy: {str(e)}")
