"""
Unit tests for stock crawler service

測試內容：
1. 股票資料獲取功能
2. 日期格式處理
3. 資料清洗和轉換
4. 錯誤處理
"""
import pytest
import pandas as pd
from datetime import datetime, timedelta
from app.services.stock_crawler import StockCrawler


class TestStockDataFetching:
    """測試股票資料獲取"""

    def test_fetch_valid_stock(self):
        """測試：獲取有效股票資料"""
        symbol = "2330.TW"
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        df = StockCrawler.fetch_stock_data(symbol, start_date, end_date)

        assert df is not None
        assert not df.empty
        assert 'date' in df.columns
        assert 'open' in df.columns
        assert 'high' in df.columns
        assert 'low' in df.columns
        assert 'close' in df.columns
        assert 'volume' in df.columns

    def test_fetch_invalid_symbol(self):
        """測試：無效股票代號處理"""
        symbol = "INVALID.SYMBOL"
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        df = StockCrawler.fetch_stock_data(symbol, start_date, end_date)

        # 應該返回 None 或空 DataFrame
        assert df is None or df.empty

    def test_date_format_handling(self):
        """測試：日期格式正確性"""
        symbol = "2330.TW"
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

        df = StockCrawler.fetch_stock_data(symbol, start_date, end_date)

        if df is not None and not df.empty:
            # 檢查日期格式
            first_date = df['date'].iloc[0]
            assert isinstance(first_date, str)
            # 驗證日期格式 YYYY-MM-DD
            datetime.strptime(first_date, '%Y-%m-%d')


class TestDataValidation:
    """測試資料驗證"""

    def test_price_data_validity(self):
        """測試：價格資料有效性"""
        symbol = "2330.TW"
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

        df = StockCrawler.fetch_stock_data(symbol, start_date, end_date)

        if df is not None and not df.empty:
            # 價格應該都是正數
            assert (df['open'] > 0).all()
            assert (df['high'] > 0).all()
            assert (df['low'] > 0).all()
            assert (df['close'] > 0).all()

            # High 應該 >= Low
            assert (df['high'] >= df['low']).all()

    def test_volume_data_validity(self):
        """測試：成交量資料有效性"""
        symbol = "2330.TW"
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

        df = StockCrawler.fetch_stock_data(symbol, start_date, end_date)

        if df is not None and not df.empty:
            # 成交量應該是非負數
            assert (df['volume'] >= 0).all()


# 範例：如何運行這些測試
"""
# 運行所有爬蟲測試
pytest backend/tests/unit/test_stock_crawler.py -v

# 運行特定測試（跳過網路測試）
pytest backend/tests/unit/test_stock_crawler.py -v -m "not network"

# 顯示print輸出
pytest backend/tests/unit/test_stock_crawler.py -v -s
"""
