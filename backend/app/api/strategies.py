# -*- coding: utf-8 -*-
"""
Strategy API endpoints - With user authentication
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from psycopg2.extras import RealDictCursor
from datetime import datetime
from uuid import UUID

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
    id: UUID
    user_id: UUID
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
async def get_strategies(
    sort_by: str = "created_at",  # 新增功能：讓前端告訴我們要排哪個欄位
    order: str = "desc",          # 新增功能：asc(由小到大) 或 desc(由大到小)
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all strategies for current user with sorting options"""
    try:
        # 1. 安全檢查：設定「白名單」，只允許特定的欄位排序，防止 SQL 注入攻擊
        # 你的隊友想要：策略類型(strategy_type)、創建時間(created_at)、或是名稱(name)
        valid_sort_fields = ["created_at", "strategy_type", "name", "initial_capital"]
        
        # 如果前端傳來的欄位不在白名單內，就強制改回預設的 'created_at'
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"

        # 2. 檢查排序方向，只允許 asc 或 desc
        if order.lower() not in ["asc", "desc"]:
            order = "desc"

        cursor = db.cursor(cursor_factory=RealDictCursor)

        # 3. 動態組合 SQL 指令
        # 注意看最後一行 ORDER BY {sort_by} {order}
        query = f"""
            SELECT id, user_id, name, description, strategy_type, initial_capital,
                   short_period, long_period,
                   rsi_period, rsi_overbought, rsi_oversold,
                   macd_fast, macd_slow, macd_signal,
                   bb_period, bb_std_dev,
                   grid_lower_price, grid_upper_price, grid_num_grids, grid_investment_per_grid,
                   stop_loss_pct, take_profit_pct, position_size_pct,
                   created_at::text as created_at
            FROM strategies
            WHERE user_id = %s
            ORDER BY {sort_by} {order}
        """

        cursor.execute(query, (current_user['id'],))

        strategies = cursor.fetchall()
        cursor.close()

        return strategies

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")

@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get single strategy by ID"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, user_id, name, description, strategy_type, initial_capital,
                   short_period, long_period,
                   rsi_period, rsi_overbought, rsi_oversold,
                   macd_fast, macd_slow, macd_signal,
                   bb_period, bb_std_dev,
                   grid_lower_price, grid_upper_price, grid_num_grids, grid_investment_per_grid,
                   stop_loss_pct, take_profit_pct, position_size_pct,
                   created_at::text as created_at
            FROM strategies
            WHERE id = %s AND user_id = %s
        """, (strategy_id, current_user['id']))

        row = cursor.fetchone()
        cursor.close()

        if not row:
            raise HTTPException(status_code=404, detail="Strategy not found")

        return row

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy: {str(e)}")


@router.post("/", response_model=StrategyResponse)
async def create_strategy(
    strategy: StrategyCreate,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create new strategy for current user"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            INSERT INTO strategies (
                user_id,
                name, description, strategy_type, initial_capital,
                short_period, long_period,
                rsi_period, rsi_overbought, rsi_oversold,
                macd_fast, macd_slow, macd_signal,
                bb_period, bb_std_dev,
                grid_lower_price, grid_upper_price, grid_num_grids, grid_investment_per_grid,
                stop_loss_pct, take_profit_pct, position_size_pct
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, name, description, strategy_type, initial_capital,
                      short_period, long_period,
                      rsi_period, rsi_overbought, rsi_oversold,
                      macd_fast, macd_slow, macd_signal,
                      bb_period, bb_std_dev,
                      grid_lower_price, grid_upper_price, grid_num_grids, grid_investment_per_grid,
                      stop_loss_pct, take_profit_pct, position_size_pct,
                      created_at::text as created_at
        """, (
            current_user['id'],
            strategy.name, strategy.description, strategy.strategy_type, strategy.initial_capital,
            strategy.short_period, strategy.long_period,
            strategy.rsi_period, strategy.rsi_overbought, strategy.rsi_oversold,
            strategy.macd_fast, strategy.macd_slow, strategy.macd_signal,
            strategy.bb_period, strategy.bb_std_dev,
            strategy.grid_lower_price, strategy.grid_upper_price, strategy.grid_num_grids, strategy.grid_investment_per_grid,
            strategy.stop_loss_pct, strategy.take_profit_pct, strategy.position_size_pct
        ))

        new_strategy = cursor.fetchone()
        cursor.close()
        db.commit()

        return new_strategy

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create strategy: {str(e)}")


@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(
    strategy_id: int,
    strategy: StrategyCreate,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update existing strategy"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)

        # Check if strategy exists and belongs to user
        cursor.execute("""
            SELECT id FROM strategies
            WHERE id = %s AND user_id = %s
        """, (strategy_id, current_user['id']))
        if not cursor.fetchone():
            cursor.close()
            raise HTTPException(status_code=404, detail="Strategy not found")

        # Update strategy
        cursor.execute("""
            UPDATE strategies SET
                name = %s, description = %s, strategy_type = %s, initial_capital = %s,
                short_period = %s, long_period = %s,
                rsi_period = %s, rsi_overbought = %s, rsi_oversold = %s,
                macd_fast = %s, macd_slow = %s, macd_signal = %s,
                bb_period = %s, bb_std_dev = %s,
                grid_lower_price = %s, grid_upper_price = %s, grid_num_grids = %s, grid_investment_per_grid = %s,
                stop_loss_pct = %s, take_profit_pct = %s, position_size_pct = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, user_id, name, description, strategy_type, initial_capital,
                      short_period, long_period,
                      rsi_period, rsi_overbought, rsi_oversold,
                      macd_fast, macd_slow, macd_signal,
                      bb_period, bb_std_dev,
                      grid_lower_price, grid_upper_price, grid_num_grids, grid_investment_per_grid,
                      stop_loss_pct, take_profit_pct, position_size_pct,
                      created_at::text as created_at
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

        updated_strategy = cursor.fetchone()
        cursor.close()
        db.commit()

        return updated_strategy

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update strategy: {str(e)}")


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete strategy"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)

        # Check if strategy exists and belongs to user
        cursor.execute("""
            SELECT id FROM strategies
            WHERE id = %s AND user_id = %s
        """, (strategy_id, current_user['id']))
        if not cursor.fetchone():
            cursor.close()
            raise HTTPException(status_code=404, detail="Strategy not found")

        # Delete strategy
        cursor.execute("DELETE FROM strategies WHERE id = %s", (strategy_id,))
        cursor.close()
        db.commit()

        return {"success": True, "message": "Strategy deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete strategy: {str(e)}")
