"""
Pytest configuration and shared fixtures
"""
import pytest
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi.testclient import TestClient
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.core.database import get_db, init_db
from app.core.security import get_password_hash

# Test database URL - 使用不同的測試資料庫
TEST_DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/trading_simulator_test"


@pytest.fixture(scope="session")
def test_db_connection():
    """
    Session-scoped fixture for test database connection
    在整個測試會話中只創建一次
    """
    # 連接到 postgres 資料庫來創建測試資料庫
    conn = psycopg2.connect(
        "postgresql://postgres:postgres123@localhost:5432/postgres"
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # 嘗試刪除測試資料庫（如果存在）
    try:
        cursor.execute("DROP DATABASE IF EXISTS trading_simulator_test")
    except:
        pass

    # 創建測試資料庫
    cursor.execute("CREATE DATABASE trading_simulator_test")
    cursor.close()
    conn.close()

    # 連接到測試資料庫並初始化
    test_conn = psycopg2.connect(TEST_DATABASE_URL)

    yield test_conn

    # Teardown: 關閉連接
    test_conn.close()

    # 刪除測試資料庫
    conn = psycopg2.connect(
        "postgresql://postgres:postgres123@localhost:5432/postgres"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("DROP DATABASE IF EXISTS trading_simulator_test")
    cursor.close()
    conn.close()


@pytest.fixture(scope="function")
def db_connection(test_db_connection):
    """
    Function-scoped fixture for database connection
    每個測試函數都會獲得一個新的事務
    """
    # 開始事務
    test_db_connection.rollback()  # 確保乾淨的開始
    cursor = test_db_connection.cursor(cursor_factory=RealDictCursor)

    yield test_db_connection

    # Teardown: 回滾事務
    test_db_connection.rollback()


@pytest.fixture(scope="session")
def client():
    """
    FastAPI test client
    """
    return TestClient(app)


@pytest.fixture
def test_user_data():
    """
    測試用戶資料
    """
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123456!",
        "full_name": "Test User"
    }


@pytest.fixture
def test_stock_data():
    """
    測試股票資料
    """
    return {
        "symbol": "2330.TW",
        "name": "台積電",
        "exchange": "TWSE",
        "industry": "半導體",
        "sector": "科技"
    }


@pytest.fixture
def test_strategy_data():
    """
    測試策略資料
    """
    return {
        "name": "Test MA Strategy",
        "description": "Test moving average strategy",
        "strategy_type": "moving_average",
        "initial_capital": 100000,
        "short_period": 5,
        "long_period": 20
    }


@pytest.fixture
def authenticated_headers(client, test_user_data):
    """
    獲取已認證的請求頭
    """
    # 註冊用戶
    client.post("/api/auth/register", json=test_user_data)

    # 登入
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
    )

    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}
