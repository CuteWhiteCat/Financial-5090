"""
股票相關 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from psycopg2.extras import RealDictCursor
from ..core.database import get_db

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/", response_model=List[Dict])
async def get_stocks(db = Depends(get_db)):
    """取得所有股票清單"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT symbol, name, exchange, industry, sector, is_active
            FROM stocks
            WHERE is_active = TRUE
            ORDER BY symbol
        """)

        stocks = cursor.fetchall()
        cursor.close()
        return stocks

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取股票清單失敗: {str(e)}")


@router.get("/{symbol}")
async def get_stock_detail(symbol: str, db = Depends(get_db)):
    """取得股票詳細資訊"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT symbol, name, exchange, industry, sector
            FROM stocks
            WHERE symbol = %s AND is_active = TRUE
        """, (symbol,))

        row = cursor.fetchone()
        cursor.close()

        if not row:
            raise HTTPException(status_code=404, detail="股票不存在")

        return row

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取股票詳情失敗: {str(e)}")


@router.get("/{symbol}/prices")
async def get_stock_prices(
    symbol: str,
    start_date: str = None,
    end_date: str = None,
    db = Depends(get_db)
):
    """取得股票歷史價格"""
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT date::text as date, open, high, low, close, volume
            FROM stock_prices
            WHERE symbol = %s
        """
        params = [symbol]

        if start_date:
            query += " AND date >= %s"
            params.append(start_date)

        if end_date:
            query += " AND date <= %s"
            params.append(end_date)

        query += " ORDER BY date ASC"

        cursor.execute(query, params)

        prices = cursor.fetchall()
        cursor.close()

        return {
            'symbol': symbol,
            'count': len(prices),
            'prices': prices
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取價格資料失敗: {str(e)}")
