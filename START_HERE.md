# 🚀 開始使用 - 最簡單的方式

## ⚡ 快速啟動（3步驟）

### 步驟 1: 啟動後端

```bash
雙擊執行: start-backend-only.bat
```

**這個腳本會**:
- ✅ 自動創建新的虛擬環境
- ✅ 顯示每個套件的安裝進度 (1/15, 2/15, ...)
- ✅ 自動啟動後端服務器

**等待約 2-3 分鐘**，看到：
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**保持這個窗口開啟！**

---

### 步驟 2: 啟動前端（在新窗口）

```bash
雙擊執行: start-frontend-only.bat
```

**這個腳本會**:
- ✅ 檢查 Node.js 安裝
- ✅ 自動安裝依賴（首次需要 3-5 分鐘）
- ✅ 啟動 React 開發服務器

**等待約 30-60 秒**，看到：
```
webpack compiled successfully
```

瀏覽器會自動打開 http://localhost:3000

---

### 步驟 3: 開始使用！

訪問：
- **前端應用**: http://localhost:3000
- **後端 API 文檔**: http://localhost:8000/docs
- **後端健康檢查**: http://localhost:8000/health

---

## 📊 詳細說明

### 後端安裝進度

你會看到：
```
[1/15] Installing fastapi...          ✓ 5-10秒
[2/15] Installing uvicorn...          ✓ 10-15秒
[3/15] Installing python-multipart... ✓ 5秒
[4/15] Installing psycopg2-binary...  ✓ 10秒
[5/15] Installing python-jose...      ✓ 15秒
[6/15] Installing passlib...          ✓ 10秒
[7/15] Installing python-dotenv...    ✓ 5秒
[8/15] Installing pydantic...         ✓ 10秒
[9/15] Installing pydantic-settings...✓ 5秒
[10/15] Installing pandas...          ✓ 30-60秒 ⚠️ 最慢
[11/15] Installing numpy...           ✓ 20-40秒
[12/15] Installing yfinance...        ✓ 10-20秒
[13/15] Installing requests...        ✓ 5秒
[14/15] Installing python-dateutil... ✓ 5秒
[15/15] Installing pytz...            ✓ 5秒

總計: 約 2-3 分鐘
```

### 前端安裝

首次運行會安裝 node_modules（3-5 分鐘）。
後續運行會跳過安裝，直接啟動（10-20 秒）。

---

## ✅ 成功標誌

### 後端成功
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 前端成功
```
Compiled successfully!

You can now view trading-strategy-simulator-frontend in the browser.

  Local:            http://localhost:3000
```

---

## 🛑 停止服務

在每個窗口按 `Ctrl+C` 或直接關閉窗口。

---

## 🎯 測試 API

### 1. 查看 API 文檔
打開: http://localhost:8000/docs

### 2. 測試健康檢查
打開: http://localhost:8000/health

應該看到：
```json
{
  "status": "healthy",
  "service": "Trading Strategy Simulator"
}
```

### 3. 測試股票列表
在 API 文檔中找到 `GET /api/stocks/`，點擊 "Try it out" → "Execute"

應該看到 10 檔台灣股票。

### 4. 創建策略
在 API 文檔中找到 `POST /api/strategies/`，輸入：

```json
{
  "name": "測試策略",
  "description": "5/20 MA",
  "strategy_type": "moving_average",
  "short_period": 5,
  "long_period": 20,
  "initial_capital": 100000
}
```

點擊 "Execute"，應該返回成功。

### 5. 執行回測
在 API 文檔中找到 `POST /api/backtest/run`，輸入：

```json
{
  "symbol": "2330.TW",
  "start_date": "2024-01-01",
  "end_date": "2024-10-31",
  "initial_capital": 100000,
  "strategy_type": "moving_average",
  "short_period": 5,
  "long_period": 20
}
```

點擊 "Execute"，等待 10-30 秒，應該返回回測結果！

---

## ❓ 常見問題

### Q: 腳本執行時沒反應？

**A**: Windows 可能阻止執行。右鍵點擊 `.bat` 文件 → 屬性 → 解除封鎖。

### Q: 後端啟動失敗？

**A**:
1. 確認 Python 已安裝: `py --version`
2. 刪除 `backend/venv` 文件夾
3. 重新執行 `start-backend-only.bat`

### Q: 前端啟動失敗？

**A**:
1. 確認 Node.js 已安裝: `node --version`
2. 刪除 `frontend/node_modules` 文件夾
3. 重新執行 `start-frontend-only.bat`

### Q: 端口被占用？

**A**:
```bash
# 後端端口 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# 前端端口 3000
# 會自動提示使用其他端口，輸入 Y 即可
```

### Q: 安裝太慢？

**A**: 使用國內鏡像

**Python**:
```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

**Node.js**:
```bash
npm config set registry https://registry.npmmirror.com
```

---

## 📁 文件說明

- **start-backend-only.bat** ← 啟動後端（先執行這個）
- **start-frontend-only.bat** ← 啟動前端（再執行這個）
- **START_HERE.md** ← 你正在看的文件
- **MANUAL_START_GUIDE.md** ← 手動啟動指南
- **DOCKER_STUCK_FIX.md** ← Docker 問題解決

---

## 🎊 就這樣！

1. 雙擊 `start-backend-only.bat`
2. 等待看到 "Uvicorn running"
3. 雙擊 `start-frontend-only.bat`
4. 等待瀏覽器自動打開
5. 開始使用！

**預計總時間**: 首次 5-8 分鐘，後續 1-2 分鐘

**祝您使用愉快！** 📈🚀
