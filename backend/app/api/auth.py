"""
用戶認證相關 API 路由
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta
from psycopg2.extras import RealDictCursor
from uuid import UUID

from ..core.database import get_db
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# OAuth2 配置
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class UserCreate(BaseModel):
    """用戶註冊模型"""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    """用戶響應模型"""
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: str


class Token(BaseModel):
    """Token響應模型"""
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    """Token數據模型"""
    username: Optional[str] = None


def get_user_by_username(db, username: str):
    """根據用戶名獲取用戶"""
    cursor = db.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT id, username, email, hashed_password, full_name, is_active,
               created_at::text as created_at
        FROM users
        WHERE username = %s
    """, (username,))
    result = cursor.fetchone()
    cursor.close()
    return result


def get_user_by_email(db, email: str):
    """根據郵箱獲取用戶"""
    cursor = db.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT id, username, email, hashed_password, full_name, is_active,
               created_at::text as created_at
        FROM users
        WHERE email = %s
    """, (email,))
    result = cursor.fetchone()
    cursor.close()
    return result


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db = Depends(get_db)
):
    """獲取當前登入用戶"""
    payload = decode_access_token(token)

    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 無效，缺少使用者資訊，請重新登入",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="使用者不存在或已被刪除，請重新登入",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db = Depends(get_db)):
    """用戶註冊"""
    try:
        # 檢查用戶名是否已存在
        if get_user_by_username(db, user.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用戶名已存在，請更換用戶名"
            )

        # 檢查郵箱是否已存在
        if get_user_by_email(db, user.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email 已被註冊，請改用其他 Email"
            )

        # 創建新用戶
        cursor = db.cursor(cursor_factory=RealDictCursor)
        hashed_password = get_password_hash(user.password)

        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, full_name)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, full_name, is_active, created_at::text as created_at
        """, (user.username, user.email, hashed_password, user.full_name))

        new_user = cursor.fetchone()
        cursor.close()
        db.commit()

        return UserResponse(**new_user)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db = Depends(get_db)
):
    """用戶登入"""
    # 獲取用戶
    user = get_user_by_username(db, form_data.username)

    # 驗證用戶和密碼
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 檢查用戶是否啟用
    if not user['is_active']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # 創建access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']},
        expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user['id'],
            username=user['username'],
            email=user['email'],
            full_name=user['full_name'],
            is_active=user['is_active'],
            created_at=user['created_at']
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """獲取當前用戶信息"""
    return UserResponse(
        id=current_user['id'],
        username=current_user['username'],
        email=current_user['email'],
        full_name=current_user['full_name'],
        is_active=current_user['is_active'],
        created_at=current_user['created_at']
    )


@router.post("/logout")
async def logout():
    """用戶登出（前端需要清除token）"""
    return {"message": "Successfully logged out"}
