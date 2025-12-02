"""
安全相關工具函數
包含密碼哈希、JWT token生成等
"""
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from passlib.context import CryptContext
from jose import JWTError, jwt

# Passlib expects bcrypt.__about__.__version__ (removed in bcrypt>=4.1), so shim it.
if not hasattr(bcrypt, "__about__"):
    class _BcryptAbout:
        __version__ = getattr(bcrypt, "__version__", "unknown")

    bcrypt.__about__ = _BcryptAbout()

# 密碼哈希配置
# Note: bcrypt automatically truncates passwords >72 bytes as of bcrypt 4.1+
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT配置
SECRET_KEY = "your-secret-key-change-this-in-production-09f26e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證密碼"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """生成密碼哈希"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    創建JWT access token

    Args:
        data: 要編碼到token中的數據
        expires_delta: token過期時間

    Returns:
        JWT token字符串
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    解碼JWT token

    Args:
        token: JWT token字符串

    Returns:
        解碼後的數據，如果token無效則返回None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
