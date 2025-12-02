# API 測試 (API Tests)

## 📝 說明

API 測試是端到端的集成測試，測試完整的 HTTP 請求/響應流程。

## 📂 測試文件

### 1. test_auth_api.py - 認證 API 測試

**測試內容**:

#### 用戶註冊 (POST /api/auth/register)
- ✅ 成功註冊新用戶
- ✅ 重複用戶名註冊失敗
- ✅ 重複郵箱註冊失敗
- ✅ 無效郵箱格式驗證

#### 用戶登入 (POST /api/auth/login)
- ✅ 成功登入並獲取 Token
- ✅ 錯誤密碼登入失敗
- ✅ 不存在的用戶登入失敗

#### Token 認證
- ✅ 使用有效 Token 訪問受保護端點
- ✅ 未提供 Token 訪問失敗
- ✅ 無效 Token 訪問失敗

#### 獲取用戶資訊 (GET /api/auth/me)
- ✅ 獲取當前用戶資訊

#### 登出 (POST /api/auth/logout)
- ✅ 成功登出

**運行測試**:
```bash
# 運行所有認證測試
pytest tests/api/test_auth_api.py -v

# 運行註冊測試
pytest tests/api/test_auth_api.py::TestUserRegistration -v

# 運行登入測試
pytest tests/api/test_auth_api.py::TestUserLogin -v

# 運行 Token 測試
pytest tests/api/test_auth_api.py::TestTokenAuthentication -v
```

**測試範例**:
```python
def test_login_success(client, test_user_data):
    """測試成功登入"""
    # 先註冊
    client.post("/api/auth/register", json=test_user_data)

    # 登入
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
```

---

### 2. test_stocks_api.py - 股票 API 測試

**測試內容**:

#### 獲取股票列表 (GET /api/stocks)
- ✅ 獲取所有股票
- ✅ 股票資料格式正確

#### 獲取股票詳情 (GET /api/stocks/{symbol})
- ✅ 獲取存在的股票
- ✅ 獲取不存在的股票（404）

#### 獲取股票價格 (GET /api/stocks/{symbol}/prices)
- ✅ 獲取指定日期範圍價格
- ✅ 資料格式正確性

**運行測試**:
```bash
pytest tests/api/test_stocks_api.py -v
```

---

### 3. test_strategies_api.py - 策略 API 測試

**測試內容**:

#### 獲取策略列表 (GET /api/strategies)
- ✅ 需要認證
- ✅ 返回用戶自己的策略

#### 創建策略 (POST /api/strategies)
- ✅ 成功創建策略
- ✅ 驗證策略參數

#### 獲取策略詳情 (GET /api/strategies/{id})
- ✅ 獲取自己的策略
- ✅ 無法獲取他人的策略

#### 更新策略 (PUT /api/strategies/{id})
- ✅ 成功更新策略
- ✅ 無法更新他人的策略

#### 刪除策略 (DELETE /api/strategies/{id})
- ✅ 成功刪除策略
- ✅ 無法刪除他人的策略

**運行測試**:
```bash
pytest tests/api/test_strategies_api.py -v
```

---

### 4. test_backtest_api.py - 回測 API 測試

**測試內容**:

#### 執行回測 (POST /api/backtest/run)
- ✅ 成功執行回測
- ✅ 返回完整結果
- ✅ 不同策略類型測試
- ✅ 無效參數處理

**運行測試**:
```bash
pytest tests/api/test_backtest_api.py -v
```

**注意事項**:
- ⚠️ 回測測試會實際呼叫 yfinance API
- ⚠️ 測試時間較長
- 💡 可以使用 Mock 加速測試

---

## 🎯 測試重點

API 測試應該驗證：
1. **HTTP 狀態碼** - 200, 201, 400, 401, 404 等
2. **響應格式** - JSON 結構正確
3. **認證授權** - 需要 Token 的端點
4. **數據驗證** - 輸入驗證和錯誤處理
5. **業務邏輯** - 端到端的業務流程

## 📊 測試覆蓋

### API 端點覆蓋率

**認證 API** (test_auth_api.py)
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ GET /api/auth/me
- ✅ POST /api/auth/logout

**股票 API** (test_stocks_api.py)
- ⬜ GET /api/stocks
- ⬜ GET /api/stocks/{symbol}
- ⬜ GET /api/stocks/{symbol}/prices

**策略 API** (test_strategies_api.py)
- ⬜ GET /api/strategies
- ⬜ POST /api/strategies
- ⬜ GET /api/strategies/{id}
- ⬜ PUT /api/strategies/{id}
- ⬜ DELETE /api/strategies/{id}

**回測 API** (test_backtest_api.py)
- ⬜ POST /api/backtest/run
- ⬜ GET /api/backtest/history

## 🔄 運行所有 API 測試

```bash
# 運行所有 API 測試
pytest tests/api/ -v

# 運行並生成報告
pytest tests/api/ --html=api_test_report.html

# 並行運行（需要 pytest-xdist）
pytest tests/api/ -n auto
```

## 💡 使用 Fixtures

### authenticated_headers

獲取已認證的請求頭：

```python
def test_protected_endpoint(client, authenticated_headers):
    response = client.get(
        "/api/protected",
        headers=authenticated_headers
    )
    assert response.status_code == 200
```

### test_user_data, test_stock_data, test_strategy_data

預定義的測試資料：

```python
def test_create_strategy(client, authenticated_headers, test_strategy_data):
    response = client.post(
        "/api/strategies",
        json=test_strategy_data,
        headers=authenticated_headers
    )
    assert response.status_code == 201
```

## 🐛 調試 API 測試

### 查看請求/響應

```python
def test_debug_example(client):
    response = client.post("/api/endpoint", json=data)

    # 打印響應內容
    print(f"Status: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Body: {response.json()}")

    assert response.status_code == 200
```

### 使用 -s 參數

```bash
# 顯示 print 輸出
pytest tests/api/test_auth_api.py -v -s
```

## 📝 編寫新 API 測試

### 測試模板

```python
"""
API Tests for [API 名稱]

測試內容：
1. [端點 1] - [方法]
2. [端點 2] - [方法]
"""
import pytest


class Test[API名稱]:
    """測試 [API 描述]"""

    def test_[操作]_success(self, client, authenticated_headers):
        """測試：成功的 [操作]"""
        # Prepare
        data = {"key": "value"}

        # Execute
        response = client.post(
            "/api/endpoint",
            json=data,
            headers=authenticated_headers
        )

        # Assert
        assert response.status_code == 200
        assert "key" in response.json()

    def test_[操作]_unauthorized(self, client):
        """測試：未認證訪問失敗"""
        response = client.post("/api/endpoint")
        assert response.status_code == 401
```

## 🔒 測試認證

### 需要認證的端點

```python
def test_requires_authentication(client):
    """測試未認證訪問"""
    response = client.get("/api/protected")
    assert response.status_code == 401


def test_with_authentication(client, authenticated_headers):
    """測試已認證訪問"""
    response = client.get("/api/protected", headers=authenticated_headers)
    assert response.status_code == 200
```

### 測試授權

```python
def test_cannot_access_others_data(client, authenticated_headers):
    """測試無法訪問他人資料"""
    # 創建資源
    response1 = client.post("/api/resource", headers=authenticated_headers)
    resource_id = response1.json()["id"]

    # 使用另一個用戶嘗試訪問
    other_headers = get_another_user_headers()
    response2 = client.get(f"/api/resource/{resource_id}", headers=other_headers)

    assert response2.status_code == 404  # or 403
```

## 📚 相關資源

- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [TestClient 文檔](https://www.starlette.io/testclient/)
- [HTTP 狀態碼](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API 測試最佳實踐](https://restfulapi.net/rest-api-testing/)
