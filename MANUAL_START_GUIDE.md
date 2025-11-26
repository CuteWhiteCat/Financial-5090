# 🚀 手動啟動指南

如果自動腳本卡住，請按照以下步驟手動啟動：

---

## 📝 步驟1: 啟動後端（Backend）

### 1.1 打開第一個命令提示字元

```bash
# Windows 搜索 "cmd" 並打開
```

### 1.2 進入 backend 目錄

```bash
cd "C:\NYCU\Database\FInal Project\backend"
```

### 1.3 創建虛擬環境（首次需要）

```bash
py -m venv venv
```

### 1.4 激活虛擬環境

```bash
venv\Scripts\activate
```

你會看到命令提示符前面出現 `(venv)`

### 1.5 升級 pip

```bash
python -m pip install --upgrade pip
```

### 1.6 安裝依賴（一個一個安裝）

如果 `pip install -r requirements.txt` 卡住，請手動安裝：

```bash
pip install fastapi
pip install uvicorn
pip install python-multipart
pip install psycopg2-binary
pip install python-jose
pip install passlib
pip install python-dotenv
pip install pydantic
pip install pydantic-settings
pip install pandas
pip install numpy
pip install yfinance
pip install requests
pip install python-dateutil
pip install pytz
```

### 1.7 啟動後端

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**看到這個表示成功**：
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**保持這個窗口開啟！**

---

## 🎨 步驟2: 啟動前端（Frontend）

### 2.1 打開第二個命令提示字元

```bash
# 再打開一個新的 cmd 窗口
```

### 2.2 進入 frontend 目錄

```bash
cd "C:\NYCU\Database\FInal Project\frontend"
```

### 2.3 安裝依賴（首次需要，比較慢）

```bash
npm install --legacy-peer-deps
```

這步會比較慢（3-5分鐘），請耐心等待。

如果太慢，可以使用國內鏡像：

```bash
npm config set registry https://registry.npmmirror.com
npm install --legacy-peer-deps
```

### 2.4 啟動前端

```bash
npm start
```

**看到這個表示成功**：
```
Compiled successfully!
You can now view trading-strategy-simulator-frontend in the browser.
  Local:            http://localhost:3000
```

瀏覽器會自動打開 http://localhost:3000

---

## ✅ 驗證安裝

### 檢查後端

在瀏覽器打開：
- http://localhost:8000 - 應該看到 JSON 響應
- http://localhost:8000/docs - 應該看到 API 文檔

### 檢查前端

在瀏覽器打開：
- http://localhost:3000 - 應該看到應用界面

---

## 🛑 停止服務

在兩個命令提示字元窗口中：
```bash
按 Ctrl+C
```

或直接關閉窗口。

---

## ❓ 常見問題

### Q1: pip install 很慢

**解決方案**：使用國內鏡像

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

然後重新安裝。

### Q2: npm install 卡住

**解決方案1**：使用國內鏡像

```bash
npm config set registry https://registry.npmmirror.com
```

**解決方案2**：清理緩存

```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Q3: 端口被占用

**後端端口 8000 被占用**：

```bash
# 查找占用進程
netstat -ano | findstr :8000

# 殺死進程（替換 PID）
taskkill /PID <PID> /F

# 或使用其他端口
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**前端端口 3000 被占用**：

會自動提示使用其他端口（如 3001），輸入 `Y` 即可。

### Q4: Python 模塊導入錯誤

確保虛擬環境已激活（命令提示符前有 `(venv)`）

```bash
# 重新激活
cd backend
venv\Scripts\activate
```

---

## 📊 完整的依賴列表

### Python 依賴（Backend）

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
pandas==2.1.4
numpy==1.26.3
yfinance==0.2.35
requests==2.31.0
python-dateutil==2.8.2
pytz==2023.3.post1
```

### Node.js 依賴（Frontend）

在 `package.json` 中定義，npm 會自動安裝。

---

## 🎯 快速命令參考

### 啟動後端
```bash
cd "C:\NYCU\Database\FInal Project\backend"
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 啟動前端
```bash
cd "C:\NYCU\Database\FInal Project\frontend"
npm start
```

---

## 💡 建議

**首次安裝**：
1. 先安裝後端（較快，1-2分鐘）
2. 確認後端正常運行
3. 再安裝前端（較慢，3-5分鐘）

**日常使用**：
1. 打開兩個終端
2. 一個運行後端
3. 一個運行前端
4. 開始開發！

---

## 🎉 成功標誌

當看到以下內容時，表示啟動成功：

**後端窗口**：
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**前端窗口**：
```
webpack compiled successfully
```

**瀏覽器**：
- http://localhost:3000 顯示應用界面
- http://localhost:8000/docs 顯示 API 文檔

**恭喜！現在可以開始使用了！** 🚀
