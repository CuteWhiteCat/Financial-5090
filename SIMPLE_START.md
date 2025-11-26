# 🎯 超簡單啟動指南

## ✅ 好消息

**node_modules 已經安裝好了！**

所以您可以直接啟動，不需要等待安裝！

---

## ⚡ 2 步驟啟動

### 步驟 1: 啟動後端

**打開命令提示字元（cmd）**，執行：

```bash
cd "C:\NYCU\Database\FInal Project\backend"
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**如果 venv 不存在或出錯**，執行：
```bash
start-backend-only.bat
```

### 步驟 2: 啟動前端

**打開另一個命令提示字元（cmd）**，執行：

```bash
cd "C:\NYCU\Database\FInal Project\frontend"
npm start
```

---

## 🎊 就這樣！

**等待 10-30 秒**，瀏覽器會自動打開：
- http://localhost:3000

**API 文檔**：
- http://localhost:8000/docs

---

## 📝 腳本問題

如果 `.bat` 腳本沒反應或直接關閉，這是 Windows 的常見問題。

**解決方法**：手動在 cmd 中執行上面的命令。

---

## 🔍 如果後端出錯

嘗試：

```bash
cd backend
rmdir /s /q venv
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🎯 快速命令（複製貼上）

### 後端
```bash
cd "C:\NYCU\Database\FInal Project\backend" && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端
```bash
cd "C:\NYCU\Database\FInal Project\frontend" && npm start
```

---

## ✅ 成功標誌

**後端**：
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**前端**：
```
Compiled successfully!
webpack compiled successfully
```

---

**就是這麼簡單！** 🚀
