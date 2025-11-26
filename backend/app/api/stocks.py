"""
股票相關 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
import sqlite3
from ..core.database import get_db

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/", response_model=List[Dict])
async def get_stocks(db: sqlite3.Connection = Depends(get_db)):
    """取得所有股票清單"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT symbol, name, exchange, industry, sector, is_active
            FROM stocks
            WHERE is_active = 1
            ORDER BY symbol
        """)

        stocks = []
        for row in cursor.fetchall():
            stocks.append({
                'symbol': row[0],
                'name': row[1],
                'exchange': row[2],
                'industry': row[3],
                'sector': row[4],
                'is_active': row[5] == 1
            })

        return stocks

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取股票清單失敗: {str(e)}")


@router.get("/{symbol}")
async def get_stock_detail(symbol: str, db: sqlite3.Connection = Depends(get_db)):
    """取得股票詳細資訊"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT symbol, name, exchange, industry, sector
            FROM stocks
            WHERE symbol = ? AND is_active = 1
        """, (symbol,))

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="股票不存在")

        return {
            'symbol': row[0],
            'name': row[1],
            'exchange': row[2],
            'industry': row[3],
            'sector': row[4]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取股票詳情失敗: {str(e)}")


@router.get("/{symbol}/prices")
async def get_stock_prices(
    symbol: str,
    start_date: str = None,
    end_date: str = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """取得股票歷史價格"""
    try:
        cursor = db.cursor()

        query = """
            SELECT date, open, high, low, close, volume
            FROM stock_prices
            WHERE symbol = ?
        """
        params = [symbol]

        if start_date:
            query += " AND date >= ?"
            params.append(start_date)

        if end_date:
            query += " AND date <= ?"
            params.append(end_date)

        query += " ORDER BY date ASC"

        cursor.execute(query, params)

        prices = []
        for row in cursor.fetchall():
            prices.append({
                'date': row[0],
                'open': row[1],
                'high': row[2],
                'low': row[3],
                'close': row[4],
                'volume': row[5]
            })

        return {
            'symbol': symbol,
            'count': len(prices),
            'prices': prices
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取價格資料失敗: {str(e)}")
