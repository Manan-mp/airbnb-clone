"""Auth dependencies. get_current_user is the single place a bearer token becomes a User."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def _user_from_credentials(creds: HTTPAuthorizationCredentials | None, db: Session) -> User | None:
    if creds is None:
        return None
    user_id = decode_access_token(creds.credentials)
    return db.get(User, user_id) if user_id is not None else None


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User:
    user = _user_from_credentials(creds, db)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User | None:
    return _user_from_credentials(creds, db)


def require_host(user: User = Depends(get_current_user)) -> User:
    if user.role != "host":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Host account required")
    return user
