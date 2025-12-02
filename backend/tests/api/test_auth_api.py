"""
API Integration Tests for Authentication Endpoints

測試內容：
1. 用戶註冊流程
2. 用戶登入流程
3. Token 驗證
4. 獲取當前用戶資訊
5. 登出功能
6. 錯誤處理
"""
import pytest
from fastapi.testclient import TestClient


class TestUserRegistration:
    """測試用戶註冊 API"""

    def test_register_success(self, client):
        """測試：成功註冊新用戶"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "Password123!",
            "full_name": "New User"
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert "id" in data
        assert "created_at" in data
        # 密碼不應該在響應中
        assert "password" not in data

    def test_register_duplicate_username(self, client):
        """測試：重複用戶名註冊失敗"""
        user_data = {
            "username": "duplicate",
            "email": "user1@example.com",
            "password": "Password123!"
        }

        # 第一次註冊
        client.post("/api/auth/register", json=user_data)

        # 第二次使用相同用戶名
        user_data["email"] = "user2@example.com"
        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client):
        """測試：重複郵箱註冊失敗"""
        user_data = {
            "username": "user1",
            "email": "duplicate@example.com",
            "password": "Password123!"
        }

        # 第一次註冊
        client.post("/api/auth/register", json=user_data)

        # 第二次使用相同郵箱
        user_data["username"] = "user2"
        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """測試：無效郵箱格式"""
        user_data = {
            "username": "testuser",
            "email": "invalid-email",
            "password": "Password123!"
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """測試用戶登入 API"""

    def test_login_success(self, client, test_user_data):
        """測試：成功登入"""
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
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == test_user_data["username"]

    def test_login_wrong_password(self, client, test_user_data):
        """測試：錯誤密碼登入失敗"""
        # 先註冊
        client.post("/api/auth/register", json=test_user_data)

        # 使用錯誤密碼登入
        response = client.post(
            "/api/auth/login",
            data={
                "username": test_user_data["username"],
                "password": "WrongPassword!"
            }
        )

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """測試：不存在的用戶登入失敗"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent",
                "password": "Password123!"
            }
        )

        assert response.status_code == 401


class TestTokenAuthentication:
    """測試 Token 認證"""

    def test_get_current_user_success(self, client, authenticated_headers):
        """測試：使用有效 Token 獲取用戶資訊"""
        response = client.get("/api/auth/me", headers=authenticated_headers)

        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert "email" in data

    def test_get_current_user_without_token(self, client):
        """測試：未提供 Token 訪問受保護端點"""
        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        """測試：無效 Token 訪問受保護端點"""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == 401


class TestLogout:
    """測試登出功能"""

    def test_logout(self, client, authenticated_headers):
        """測試：登出"""
        response = client.post("/api/auth/logout", headers=authenticated_headers)

        assert response.status_code == 200
        assert "message" in response.json()


# 範例：如何運行這些測試
"""
# 運行所有認證 API 測試
pytest backend/tests/api/test_auth_api.py -v

# 運行特定測試類別
pytest backend/tests/api/test_auth_api.py::TestUserLogin -v

# 運行特定測試
pytest backend/tests/api/test_auth_api.py::TestUserLogin::test_login_success -v

# 顯示詳細輸出
pytest backend/tests/api/test_auth_api.py -v -s

# 生成測試報告
pytest backend/tests/api/test_auth_api.py --html=report.html
"""
