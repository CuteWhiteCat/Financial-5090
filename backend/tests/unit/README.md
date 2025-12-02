# 單元測試 (Unit Tests)

## 📝 說明

單元測試專注於測試獨立的函數和類，不依賴外部資源（如資料庫、網路）。

## 📂 測試文件

### 1. test_security.py - 安全功能測試

**測試內容**:
- ✅ 密碼哈希生成
- ✅ 密碼哈希唯一性（salt 機制）
- ✅ 密碼驗證（正確/錯誤）
- ✅ 空密碼處理
- ✅ JWT Token 創建
- ✅ JWT Token 解碼
- ✅ 無效 Token 處理
- ✅ Token 過期機制
- ✅ Token 自定義資料

**運行測試**:
```bash
# 運行所有安全測試
pytest tests/unit/test_security.py -v

# 運行密碼測試
pytest tests/unit/test_security.py::TestPasswordHashing -v

# 運行 JWT 測試
pytest tests/unit/test_security.py::TestJWTTokens -v
```

**測試範例**:
```python
def test_password_verification_success():
    """測試正確密碼驗證"""
    password = "TestPassword123!"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
```

---

### 2. test_stock_crawler.py - 股票爬蟲測試

**測試內容**:
- ✅ 獲取有效股票資料
- ✅ 無效股票代號處理
- ✅ 日期格式正確性
- ✅ 價格資料有效性（正數、high >= low）
- ✅ 成交量資料有效性

**運行測試**:
```bash
# 運行所有爬蟲測試
pytest tests/unit/test_stock_crawler.py -v

# 運行資料獲取測試
pytest tests/unit/test_stock_crawler.py::TestStockDataFetching -v

# 運行資料驗證測試
pytest tests/unit/test_stock_crawler.py::TestDataValidation -v
```

**測試範例**:
```python
def test_fetch_valid_stock():
    """測試獲取有效股票資料"""
    df = StockCrawler.fetch_stock_data("2330.TW", "2024-01-01", "2024-01-31")
    assert df is not None
    assert 'close' in df.columns
    assert len(df) > 0
```

**注意事項**:
- ⚠️ 這些測試會實際呼叫 yfinance API
- ⚠️ 需要網路連接
- ⚠️ 測試速度較慢
- 💡 可以考慮使用 `@pytest.mark.slow` 標記

---

## 🎯 測試目標

單元測試應該：
1. **快速執行** - 不依賴外部資源
2. **獨立運行** - 每個測試互不影響
3. **明確目標** - 測試單一功能點
4. **易於維護** - 清晰的測試邏輯

## 📊 覆蓋率目標

- 目標覆蓋率: 80%+
- 核心業務邏輯: 100%
- 工具函數: 90%+

## 🔄 運行所有單元測試

```bash
# 運行所有單元測試
pytest tests/unit/ -v

# 運行並生成覆蓋率報告
pytest tests/unit/ --cov=app --cov-report=html

# 運行快速測試（跳過慢速測試）
pytest tests/unit/ -v -m "not slow"
```

## 💡 編寫新測試

### 測試模板

```python
"""
Unit tests for [功能名稱]

測試內容：
1. [測試項目 1]
2. [測試項目 2]
3. [測試項目 3]
"""
import pytest


class Test[功能名稱]:
    """測試 [功能描述]"""

    def test_[測試場景](self):
        """測試：[具體測試內容]"""
        # Arrange - 準備測試資料
        input_data = "test"

        # Act - 執行測試
        result = function_to_test(input_data)

        # Assert - 驗證結果
        assert result == expected_value
```

### 最佳實踐

1. **使用描述性名稱**
   ```python
   # 好
   def test_password_verification_with_wrong_password_returns_false()

   # 不好
   def test_pw_verify()
   ```

2. **一個測試一個斷言（主要）**
   ```python
   # 好
   def test_user_creation():
       user = create_user("test")
       assert user.name == "test"

   # 可接受（相關斷言）
   def test_user_creation():
       user = create_user("test")
       assert user.name == "test"
       assert user.is_active is True
   ```

3. **使用 pytest 的特性**
   ```python
   # 測試異常
   def test_invalid_input():
       with pytest.raises(ValueError):
           process_data(invalid_data)

   # 參數化測試
   @pytest.mark.parametrize("input,expected", [
       ("test1", "result1"),
       ("test2", "result2"),
   ])
   def test_multiple_inputs(input, expected):
       assert function(input) == expected
   ```

## 📚 相關資源

- [Pytest 文檔](https://docs.pytest.org/)
- [單元測試最佳實踐](https://docs.python-guide.org/writing/tests/)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)
