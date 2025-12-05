# 集成測試 (Integration Tests)

## 📝 說明

集成測試驗證多個組件之間的交互，主要測試資料庫操作和外部服務集成。

## 📂 測試範圍

### 資料庫集成測試

測試 PostgreSQL 資料庫的集成功能：
- 連接管理
- CRUD 操作
- 事務處理
- 約束驗證
- 外鍵關係

## 🎯 測試重點

1. **資料庫連接**
   - 連接池管理
   - 連接超時處理
   - 連接恢復

2. **事務管理**
   - 提交 (Commit)
   - 回滾 (Rollback)
   - 隔離級別

3. **數據完整性**
   - 主鍵約束
   - 外鍵約束
   - 唯一約束
   - 非空約束

## 💡 測試範例

### 資料庫 CRUD 測試

```python
def test_user_crud(db_connection):
    """測試用戶 CRUD 操作"""
    cursor = db_connection.cursor()

    # Create
    cursor.execute("""
        INSERT INTO users (username, email, hashed_password)
        VALUES (%s, %s, %s)
        RETURNING id
    """, ("testuser", "test@example.com", "hashed"))

    user_id = cursor.fetchone()['id']

    # Read
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    assert user['username'] == "testuser"

    # Update
    cursor.execute("""
        UPDATE users SET full_name = %s WHERE id = %s
    """, ("Test User", user_id))

    # Delete
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))

    cursor.close()
```

### 事務回滾測試

```python
def test_transaction_rollback(db_connection):
    """測試事務回滾"""
    cursor = db_connection.cursor()

    try:
        # 插入資料
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password)
            VALUES (%s, %s, %s)
        """, ("testuser", "test@example.com", "hashed"))

        # 觸發錯誤（重複用戶名）
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password)
            VALUES (%s, %s, %s)
        """, ("testuser", "other@example.com", "hashed"))

    except Exception:
        db_connection.rollback()

    # 驗證沒有資料被插入
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = %s", ("testuser",))
    count = cursor.fetchone()['count']
    assert count == 0

    cursor.close()
```

### 外鍵約束測試

```python
def test_foreign_key_constraint(db_connection):
    """測試外鍵約束"""
    cursor = db_connection.cursor()

    # 嘗試插入無效的外鍵
    with pytest.raises(Exception):
        cursor.execute("""
            INSERT INTO strategies (user_id, name, strategy_type)
            VALUES (%s, %s, %s)
        """, (99999, "Test Strategy", "moving_average"))

    cursor.close()
```

## 🔄 運行集成測試

```bash
# 運行所有集成測試
pytest tests/integration/ -v

# 運行資料庫測試
pytest tests/integration/test_database.py -v

# 顯示詳細輸出
pytest tests/integration/ -v -s
```

## ⚙️ 測試配置

### 測試資料庫

集成測試使用獨立的測試資料庫：
- 資料庫名: `trading_simulator_test`
- 自動創建和清理
- 與開發資料庫隔離

### Fixtures

#### test_db_connection
- Session-scoped
- 創建測試資料庫
- 測試結束後清理

#### db_connection
- Function-scoped
- 提供事務隔離
- 每個測試自動回滾

## ⚠️ 注意事項

1. **測試隔離**
   - 每個測試在獨立事務中
   - 自動回滾，不影響其他測試

2. **性能考慮**
   - 集成測試比單元測試慢
   - 涉及實際資料庫操作
   - 考慮使用測試資料快照

3. **資料庫狀態**
   - 確保測試資料庫已啟動
   - 檢查連接配置正確

## 📊 測試覆蓋

集成測試應該覆蓋：
- ✅ 所有資料庫表的 CRUD 操作
- ✅ 表之間的關聯關係
- ✅ 資料庫約束和觸發器
- ✅ 複雜查詢和聚合操作
- ✅ 事務和並發控制

## 🔧 故障排除

### 連接失敗

```bash
# 檢查 PostgreSQL 是否運行
pg_isready -h localhost -p 5432

# 檢查測試資料庫是否存在
psql -U postgres -l | grep trading_simulator_test
```

### 權限問題

```sql
-- 授予測試用戶權限
GRANT ALL PRIVILEGES ON DATABASE trading_simulator_test TO postgres;
```

### 清理測試資料

```bash
# 手動刪除測試資料庫
psql -U postgres -c "DROP DATABASE IF EXISTS trading_simulator_test;"
```

## 📚 相關資源

- [PostgreSQL Testing](https://www.postgresql.org/docs/current/regress.html)
- [Database Testing Best Practices](https://www.guru99.com/database-testing.html)
- [pytest-postgresql](https://pypi.org/project/pytest-postgresql/)
