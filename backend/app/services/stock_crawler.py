"""
股票資料爬蟲服務
使用 yfinance 獲取股票歷史資料
"""
import yfinance as yf
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd


class StockCrawler:
    """股票資料爬蟲"""

    @staticmethod
    def fetch_stock_data(
        symbol: str,
        start_date: str,
        end_date: str
    ) -> Optional[pd.DataFrame]:
        """
        獲取股票歷史資料

        Args:
            symbol: 股票代號 (例如: 2330.TW)
            start_date: 開始日期 (YYYY-MM-DD)
            end_date: 結束日期 (YYYY-MM-DD)

        Returns:
            DataFrame 包含股票資料，或 None 如果失敗
        """
        try:
            print(f"Fetching stock data: {symbol}")
            print(f"   Date range: {start_date} to {end_date}")

            # 使用 yfinance 獲取資料
            stock = yf.Ticker(symbol)
            df = stock.history(start=start_date, end=end_date)

            if df.empty:
                print(f"WARNING: No stock data found for: {symbol}")
                return None

            # 重設索引，將日期變成欄位
            df = df.reset_index()

            # 重新命名欄位
            df = df.rename(columns={
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })

            # 只保留需要的欄位
            df = df[['date', 'open', 'high', 'low', 'close', 'volume']]

            # 轉換日期格式
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')

            print(f"Successfully fetched {len(df)} records")

            return df

        except Exception as e:
            print(f"ERROR: Fetch failed: {str(e)}")
            return None

    @staticmethod
    def get_latest_price(symbol: str) -> Optional[Dict]:
        """
        獲取股票最新價格

        Args:
            symbol: 股票代號

        Returns:
            包含最新價格資訊的字典
        """
        try:
            stock = yf.Ticker(symbol)
            info = stock.info

            return {
                'symbol': symbol,
                'current_price': info.get('currentPrice', 0),
                'previous_close': info.get('previousClose', 0),
                'open': info.get('open', 0),
                'day_high': info.get('dayHigh', 0),
                'day_low': info.get('dayLow', 0),
                'volume': info.get('volume', 0),
            }

        except Exception as e:
            print(f"ERROR: Failed to get latest price: {str(e)}")
            return None

    @staticmethod
    def save_to_db(conn, symbol: str, df: pd.DataFrame) -> int:
        """
        將股票資料存入資料庫

        Args:
            conn: 資料庫連接
            symbol: 股票代號
            df: 股票資料 DataFrame

        Returns:
            成功存入的筆數
        """
        try:
            cursor = conn.cursor()
            count = 0

            for _, row in df.iterrows():
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO stock_prices
                        (symbol, date, open, high, low, close, volume)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        symbol,
                        row['date'],
                        float(row['open']),
                        float(row['high']),
                        float(row['low']),
                        float(row['close']),
                        int(row['volume'])
                    ))
                    count += 1
                except Exception as e:
                    print(f"WARNING: Insert failed for {row['date']}: {str(e)}")
                    continue

            conn.commit()
            print(f"Successfully saved {count} records to database")
            return count

        except Exception as e:
            print(f"ERROR: Failed to save to database: {str(e)}")
            conn.rollback()
            return 0

    @staticmethod
    def calculate_moving_average(df: pd.DataFrame, period: int) -> pd.Series:
        """
        計算移動平均線

        Args:
            df: 股票資料 DataFrame
            period: 週期天數

        Returns:
            移動平均線 Series
        """
        return df['close'].rolling(window=period).mean()

    @staticmethod
    def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """
        計算 RSI 指標

        Args:
            df: 股票資料 DataFrame
            period: 週期天數

        Returns:
            RSI Series
        """
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        return rsi
