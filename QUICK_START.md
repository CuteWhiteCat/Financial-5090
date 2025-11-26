# 🚀 快速開始指南

## 📋 前置需求

- ✅ Docker Desktop 已安裝
- ✅ Git (可選)

---

## ⚡ 3 步驟啟動

### Windows 用戶

```bash
# 1. 雙擊執行
start.bat

# 就這樣！服務會自動啟動
```

### Mac/Linux 用戶

```bash
# 1. 啟動服務
docker-compose up --build
```

### 訪問應用

- **前端**: http://localhost:3000
- **後端 API**: http://localhost:8000/docs
- **健康檢查**: http://localhost:8000/health

---

## 🎯 快速測試

### 1. 測試策略 API

打開瀏覽器訪問: http://localhost:8000/docs

找到 `POST /api/strategies/` 端點，點擊 "Try it out"，輸入：

```json
{
  "name": "我的第一個策略",
  "description": "5/20 MA 交叉策略",
  "strategy_type": "moving_average",
  "short_period": 5,
  "long_period": 20,
  "initial_capital": 100000
}
```

點擊 "Execute"

### 2. 測試回測功能

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

點擊 "Execute"，大約 10-30 秒後會看到回測結果！

### 3. 使用前端介面

訪問 http://localhost:3000

1. 點擊「回測執行」
2. 選擇股票（例如：2330.TW - 台積電）
3. 設定時間範圍和參數
4. 點擊「開始回測」
5. 查看結果！

---

## 🛑 停止服務

### Windows
```bash
stop.bat
```

### Mac/Linux
```bash
docker-compose down
```

---

## 📊 可用的股票

- **2330.TW** - 台積電 (推薦用來測試)
- **2317.TW** - 鴻海
- **2454.TW** - 聯發科
- **2308.TW** - 台達電
- **2882.TW** - 國泰金
- **2891.TW** - 中信金
- **2412.TW** - 中華電
- **2881.TW** - 富邦金
- **1301.TW** - 台塑
- **1303.TW** - 南亞

---

## 🔍 查看日誌

```bash
# 查看所有服務日誌
docker-compose logs -f

# 只看後端日誌
docker-compose logs -f backend

# 只看前端日誌
docker-compose logs -f frontend
```

---

## ❓ 遇到問題？

### 問題1: Docker 未安裝

下載並安裝 Docker Desktop:
- Windows: https://www.docker.com/products/docker-desktop/
- Mac: https://www.docker.com/products/docker-desktop/
- Linux: https://docs.docker.com/engine/install/

### 問題2: 端口被占用

```bash
# 查看端口占用
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# 修改 docker-compose.yml 中的端口映射
# 例如: "8001:8000" 改為使用 8001 端口
```

### 問題3: 建構失敗

```bash
# 清除所有容器和鏡像
docker-compose down -v
docker system prune -a

# 重新建構
docker-compose build --no-cache
docker-compose up
```

---

## 📚 更多資訊

- **完整部署指南**: 查看 `DOCKER_DEPLOYMENT.md`
- **問題解決方案**: 查看 `SOLUTION_SUMMARY.md`
- **使用教學**: 查看 `HOW_TO_USE.md`
- **資料庫設計**: 查看 `database.md`

---

## 🎊 開始使用

現在您已經準備好了！

1. 雙擊 `start.bat` (Windows) 或執行 `docker-compose up`
2. 等待服務啟動（首次啟動約需 2-5 分鐘）
3. 訪問 http://localhost:3000
4. 開始回測您的投資策略！

**祝您回測順利！** 📈
