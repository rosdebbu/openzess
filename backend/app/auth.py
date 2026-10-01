"""
Openzess Authentication & Authorization module.

Provides:
- User model (SQLAlchemy) with bcrypt-hashed passwords
- JWT (PyJWT) access-token issuance and verification
- FastAPI dependency `get_current_user` for route protection
- register / login / me endpoints
- Optional static-token auth stays in server.py; this module handles
  per-user accounts so the backend can run multi-user.

Configuration (environment):
- OPENZESS_JWT_SECRET: signing secret (REQUIRED for auth endpoints;
  auto-generated per-process if unset, with a startup warning).
- OPENZESS_TOKEN_EXPIRE_MINUTES: access token TTL (default 1440 = 24h).
"""

import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt as pyjwt
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import Column, String, Integer, DateTime

from .database import Base, _session

logger = logging.getLogger("openzess.auth")

# ── Configuration ────────────────────────────────────────────────────
JWT_SECRET = os.environ.get("OPENZESS_JWT_SECRET", "") or uuid.uuid4().hex
if not os.environ.get("OPENZESS_JWT_SECRET", "").strip():
    logger.warning(
        "OPENZESS_JWT_SECRET is not set - using a random per-process secret. "
        "Tokens will be invalidated on every restart. Set it in .env for production."
    )
TOKEN_EXPIRE_MINUTES = int(os.environ.get("OPENZESS_TOKEN_EXPIRE_MINUTES", "1440"))
JWT_ALGORITHM = "HS256"

bearer_scheme = HTTPBearer(auto_error=False)

# ── User Model ───────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Integer, default=0)          # 1 = admin
    is_active = Column(Integer, default=1)         # 1 = active
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_login_at = Column(DateTime, nullable=True)


# ── Password Hashing (bcrypt) ────────────────────────────────────────
def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (salt auto-generated)."""
    if not password or len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time verification of a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


# ── JWT Issuance / Verification ──────────────────────────────────────
def create_access_token(user: "User", expires_minutes: Optional[int] = None) -> str:
    """Issue a signed JWT access token for a user."""
    ttl = expires_minutes if expires_minutes is not None else TOKEN_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "email": user.email,
        "username": user.username,
        "is_admin": bool(user.is_admin),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ttl)).timestamp()),
        "jti": uuid.uuid4().hex[:12],
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Verify signature/expiry and return the payload. Raises 401 HTTPException."""
    try:
        return pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )


# ── FastAPI Dependencies ─────────────────────────────────────────────
_bearer = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer)) -> "User":
    """Dependency: resolve the authenticated User from a Bearer JWT.

    Usage:  user = Depends(get_current_user)
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide 'Authorization: Bearer <token>'.",
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    with _session() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists.")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")
        # Detach a plain snapshot to avoid lazy-load after session close
        return User(
            id=user.id, email=user.email, username=user.username,
            password_hash="", is_admin=user.is_admin, is_active=user.is_active,
            created_at=user.created_at, last_login_at=user.last_login_at,
        )


def get_current_admin(
    current: User = Security(get_current_user),
) -> "User":
    """Dependency: require the authenticated user to be an admin."""
    if not getattr(current, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")
    return current


# ── Account Operations ───────────────────────────────────────────────
def _is_valid_email(email: str) -> bool:
    """Simple pragmatic email shape check: a@b.tld."""
    return "@" in (email or "") and "." in (email or "").split("@")[-1]


def register_user(email: str, username: str, password: str, is_admin: bool = False) -> dict:
    """Create a new user account. Returns user info + access token."""
    email = (email or "").strip().lower()
    username = (username or "").strip()
    if not _is_valid_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address.")
    if not username or len(username) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username must be at least 3 characters.")
    password_hash = hash_password(password)  # validates length

    with _session() as db:
        existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing:
            conflict = "email" if existing.email == email else "username"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with this {conflict} already exists.",
            )
        user = User(
            id=str(uuid.uuid4()), email=email, username=username,
            password_hash=password_hash, is_admin=1 if is_admin else 0,
            is_active=1, created_at=datetime.utcnow(),
        )
        db.add(user)
        snapshot = User(
            id=user.id, email=user.email, username=user.username,
            password_hash=user.password_hash, is_admin=user.is_admin,
            is_active=user.is_active, created_at=user.created_at,
        )

    token = create_access_token(snapshot)
    return {
        "user": {"id": snapshot.id, "email": snapshot.email, "username": snapshot.username, "is_admin": bool(snapshot.is_admin)},
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRE_MINUTES * 60,
    }


def authenticate_user(identifier: str, password: str) -> dict:
    """Verify credentials (email OR username) and issue an access token."""
    identifier = (identifier or "").strip().lower()
    with _session() as db:
        user = db.query(User).filter((User.email == identifier) | (User.username == identifier)).first()
        if not user or not verify_password(password, user.password_hash):
            # Uniform error - never reveal whether the account exists
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password.",
            )
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")
        user.last_login_at = datetime.utcnow()
        snapshot = User(
            id=user.id, email=user.email, username=user.username,
            password_hash=user.password_hash, is_admin=user.is_active and user.is_admin,
            is_active=user.is_active, created_at=user.created_at, last_login_at=user.last_login_at,
        )
        snapshot.is_admin = user.is_admin
    token = create_access_token(snapshot)
    return {
        "user": {"id": snapshot.id, "email": snapshot.email, "username": snapshot.username, "is_admin": bool(snapshot.is_admin)},
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRE_MINUTES * 60,
    }


def ensure_admin_bootstrap() -> None:
    """Create the bootstrap admin account from env vars if no admin exists.

    Env: OPENZESS_ADMIN_EMAIL, OPENZESS_ADMIN_USERNAME, OPENZESS_ADMIN_PASSWORD.
    No-op when the password env is unset (local single-user mode).
    """
    admin_email = os.environ.get("OPENZESS_ADMIN_EMAIL", "").strip().lower()
    admin_pass = os.environ.get("OPENZESS_ADMIN_PASSWORD", "")
    if not admin_email or not admin_pass:
        return
    try:
        with _session() as db:
            if db.query(User).filter(User.is_admin == 1).first():
                return
        username = os.environ.get("OPENZESS_ADMIN_USERNAME", "admin").strip() or "admin"
        register_user(admin_email, username, admin_pass, is_admin=True)
        logger.info("Bootstrap admin account created for %s", admin_email)
    except HTTPException as e:
        logger.warning("Bootstrap admin skipped: %s", e.detail)
    except Exception as e:
        logger.warning("Bootstrap admin failed: %s", e)