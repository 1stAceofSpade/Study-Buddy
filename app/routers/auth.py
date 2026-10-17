from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from config import ACCESS_TOKEN_EXPIRE_MINUTES
from crud.user import create_user
from dependencies import SessionDep
from models import User
from schemas import Token, UserLogin, UserRegister, UserResponse
from security import create_access_token, get_current_user, verify_password

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user: UserRegister, db: SessionDep):
    return create_user(db, user)


@router.post("/login", response_model=Token, status_code=200)
async def login(credential: UserLogin, db: SessionDep):
    user = db.exec(select(User).where(User.email == credential.email)).first()
    if not user or not verify_password(credential.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


@router.get("/users/me", response_model=UserResponse)
async def get_user_profile(user: User = Depends(get_current_user)):
    return user


@router.get("/users/search", response_model=UserResponse, status_code=200)
async def search(user: str, db: SessionDep):
    lookup = db.exec(select(User).where(User.username == user)).first()
    if not lookup:
        raise HTTPException(status_code=404, detail="User not found")
    return lookup
