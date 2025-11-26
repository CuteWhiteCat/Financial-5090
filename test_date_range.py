"""
測試股票爬蟲的日期範圍功能
"""
import sys
sys.path.append('backend')

from app.services.stock_crawler import StockCrawler
from datetime import datetime, timedelta

# 測試不同的日期範圍
test_cases = [
    {
        "name": "過去日期 (2024-01-01 to 2024-06-30)",
        "symbol": "2330.TW",
        "start": "2024-01-01",
        "end": "2024-06-30"
    },
    {
        "name": "包含未來日期 (2024-01-01 to 2025-12-31)",
        "symbol": "2330.TW",
        "start": "2024-01-01",
        "end": "2025-12-31"
    },
    {
        "name": "完全是未來日期 (2025-01-01 to 2025-12-31)",
        "symbol": "2330.TW",
        "start": "2025-01-01",
        "end": "2025-12-31"
    },
    {
        "name": "到今天 (2024-01-01 to today)",
        "symbol": "2330.TW",
        "start": "2024-01-01",
        "end": datetime.now().strftime("%Y-%m-%d")
    }
]

print("="*80)
print("測試股票爬蟲日期範圍")
print("="*80)

for i, test in enumerate(test_cases, 1):
    print(f"\n測試 {i}: {test['name']}")
    print(f"   股票: {test['symbol']}")
    print(f"   日期: {test['start']} to {test['end']}")
    print("-"*80)

    df = StockCrawler.fetch_stock_data(
        test['symbol'],
        test['start'],
        test['end']
    )

    if df is not None and not df.empty:
        print(f"✓ 成功獲取 {len(df)} 筆資料")
        print(f"   最早日期: {df['date'].iloc[0]}")
        print(f"   最晚日期: {df['date'].iloc[-1]}")
        print(f"   價格範圍: NT${df['close'].min():.2f} - NT${df['close'].max():.2f}")
    else:
        print(f"✗ 無法獲取資料")

    print("-"*80)

print("\n" + "="*80)
print("測試完成")
print("="*80)
