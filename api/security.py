from __future__ import annotations

from hmac import compare_digest

from fastapi import Header, HTTPException, status

from .config import get_settings


async def require_internal_token(x_internal_token: str = Header(default="")) -> None:
    expected = get_settings().api_token
    if not expected:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "PYTHON_API_TOKEN missing")
    if not compare_digest(x_internal_token, expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid internal token")
