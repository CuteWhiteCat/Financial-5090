"""
Unit tests for security functions (password hashing, JWT tokens)

測試內容：
1. 密碼哈希功能
2. 密碼驗證功能
3. JWT Token 生成
4. JWT Token 解碼
5. Token 過期處理
"""
import pytest
from datetime import timedelta
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token
)


class TestPasswordHashing:
    """測試密碼哈希功能"""

    def test_password_hash_generation(self):
        """測試：密碼哈希生成"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        # 哈希後的密碼應該與原密碼不同
        assert hashed != password
        # 哈希應該包含 bcrypt 前綴
        assert hashed.startswith("$2b$")

    def test_password_hash_uniqueness(self):
        """測試：相同密碼生成不同哈希（salt 機制）"""
        password = "TestPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # 兩次哈希結果應該不同（因為 salt 不同）
        assert hash1 != hash2

    def test_password_verification_success(self):
        """測試：正確密碼驗證成功"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """測試：錯誤密碼驗證失敗"""
        password = "TestPassword123!"
        wrong_password = "WrongPassword"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_empty_password_handling(self):
        """測試：空密碼處理"""
        with pytest.raises(Exception):
            get_password_hash("")


class TestJWTTokens:
    """測試 JWT Token 功能"""

    def test_token_creation(self):
        """測試：Token 創建"""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        # Token 應該是字符串
        assert isinstance(token, str)
        # Token 應該包含三個部分（header.payload.signature）
        assert len(token.split('.')) == 3

    def test_token_decoding_success(self):
        """測試：Token 解碼成功"""
        test_username = "testuser"
        data = {"sub": test_username}
        token = create_access_token(data)

        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["sub"] == test_username

    def test_token_decoding_invalid_token(self):
        """測試：無效 Token 解碼失敗"""
        invalid_token = "invalid.token.here"
        decoded = decode_access_token(invalid_token)

        assert decoded is None

    def test_token_with_expiration(self):
        """測試：Token 帶有過期時間"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)

        decoded = decode_access_token(token)

        assert decoded is not None
        assert "exp" in decoded  # 應該包含過期時間

    def test_token_with_custom_data(self):
        """測試：Token 包含自定義資料"""
        data = {
            "sub": "testuser",
            "email": "test@example.com",
            "role": "admin"
        }
        token = create_access_token(data)
        decoded = decode_access_token(token)

        assert decoded["sub"] == "testuser"
        assert decoded["email"] == "test@example.com"
        assert decoded["role"] == "admin"


# 範例：如何運行這些測試
"""
# 運行所有安全測試
pytest backend/tests/unit/test_security.py -v

# 運行特定測試類別
pytest backend/tests/unit/test_security.py::TestPasswordHashing -v

# 運行特定測試
pytest backend/tests/unit/test_security.py::TestPasswordHashing::test_password_hash_generation -v

# 顯示詳細輸出
pytest backend/tests/unit/test_security.py -v -s
"""
