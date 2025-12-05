# 測試套件說明

## 📁 目錄結構

```
tests/
├── conftest.py          # Pytest 配置和共享 fixtures
├── unit/                # 單元測試
│   ├── test_security.py         # 安全功能測試（密碼、JWT）
│   └── test_stock_crawler.py    # 股票爬蟲測試
├── integration/         # 集成測試
│   └── test_database.py         # 資料庫集成測試
└── api/                 # API 端點測試
    ├── test_auth_api.py         # 認證 API 測試
    ├── test_stocks_api.py       # 股票 API 測試
    ├── test_strategies_api.py   # 策略 API 測試
    └── test_backtest_api.py     # 回測 API 測試
```

## 🧪 測試類型

### 1. 單元測試 (Unit Tests)
測試獨立的函數和類，不依賴外部資源。

**位置**: `tests/unit/`

**測試內容**:
- 密碼哈希和驗證
- JWT Token 生成和解碼
- 股票資料獲取和處理
- 回測引擎邏輯

### 2. 集成測試 (Integration Tests)
測試多個組件之間的交互，包括資料庫操作。

**位置**: `tests/integration/`

**測試內容**:
- 資料庫連接
- CRUD 操作
- 事務處理

### 3. API 測試 (API Tests)
測試 HTTP API 端點的完整流程。

**位置**: `tests/api/`

**測試內容**:
- 用戶註冊和登入
- 認證和授權
- 股票資料 API
- 策略管理 API
- 回測執行 API

## 🚀 運行測試

### 安裝測試依賴

```bash
cd backend
pip install pytest pytest-cov pytest-html
```

### 運行所有測試

```bash
# 運行所有測試
pytest

# 運行並顯示詳細輸出
pytest -v

# 運行並顯示 print 輸出
pytest -v -s
```

### 運行特定類型的測試

```bash
# 只運行單元測試
pytest tests/unit/ -v

# 只運行 API 測試
pytest tests/api/ -v

# 只運行集成測試
pytest tests/integration/ -v
```

### 運行特定文件的測試

```bash
# 運行認證測試
pytest tests/api/test_auth_api.py -v

# 運行安全功能測試
pytest tests/unit/test_security.py -v
```

### 運行特定測試

```bash
# 運行特定測試類別
pytest tests/api/test_auth_api.py::TestUserLogin -v

# 運行特定測試函數
pytest tests/api/test_auth_api.py::TestUserLogin::test_login_success -v
```

## 📊 測試覆蓋率

生成測試覆蓋率報告：

```bash
# 運行測試並生成覆蓋率報告
pytest --cov=app --cov-report=html --cov-report=term

# 查看 HTML 報告
# 打開 htmlcov/index.html
```

## 📝 測試報告

生成 HTML 測試報告：

```bash
pytest --html=report.html --self-contained-html

# 查看報告
# 打開 report.html
```

## 🔧 測試配置

### conftest.py

提供共享的 fixtures：

- `test_db_connection`: 測試資料庫連接
- `db_connection`: 每個測試的資料庫事務
- `client`: FastAPI 測試客戶端
- `test_user_data`: 測試用戶資料
- `test_stock_data`: 測試股票資料
- `test_strategy_data`: 測試策略資料
- `authenticated_headers`: 已認證的請求頭

### 使用 Fixtures

```python
def test_example(client, authenticated_headers):
    """使用 fixtures 的測試範例"""
    response = client.get(
        "/api/protected-endpoint",
        headers=authenticated_headers
    )
    assert response.status_code == 200
```

## ⚠️ 注意事項

1. **測試資料庫**:
   - 測試使用獨立的測試資料庫 `trading_simulator_test`
   - 每次運行測試會自動創建和清理
   - 不會影響開發資料庫

2. **測試隔離**:
   - 每個測試都在獨立的事務中運行
   - 測試結束後自動回滾
   - 確保測試之間互不影響

3. **外部依賴**:
   - 股票爬蟲測試會實際呼叫 yfinance API
   - 可能受網路狀況影響
   - 考慮使用 Mock 來加速測試

## 📚 測試最佳實踐

1. **命名規範**:
   - 測試文件: `test_*.py`
   - 測試類: `Test*`
   - 測試函數: `test_*`

2. **測試結構 (AAA)**:
   ```python
   def test_example():
       # Arrange - 準備測試資料
       user = {"username": "test"}

       # Act - 執行測試動作
       result = create_user(user)

       # Assert - 驗證結果
       assert result["username"] == "test"
   ```

3. **測試獨立性**:
   - 每個測試應該獨立運行
   - 不依賴其他測試的執行順序
   - 使用 fixtures 共享設置代碼

4. **清晰的斷言**:
   ```python
   # 好的斷言
   assert response.status_code == 200
   assert "username" in response.json()

   # 避免模糊的斷言
   assert response  # 不清楚在測試什麼
   ```

## 🐛 調試測試

### 使用 pdb 調試

```bash
# 在測試失敗時進入調試器
pytest --pdb

# 在測試開始時進入調試器
pytest --trace
```

### 顯示詳細錯誤

```bash
# 顯示完整的錯誤追蹤
pytest -v --tb=long

# 只顯示失敗的測試
pytest --failed-first
```

## 🔄 持續集成

測試可以整合到 CI/CD 流程中：

```yaml
# .github/workflows/test.yml 範例
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
```