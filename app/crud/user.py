from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import select
from models import User
from security import get_password_hash

def create_user(db, user_in):
    existing_user = db.exec(
        select(User).where(
            or_(
                User.username == user_in.username,
                User.email == user_in.email,
            )
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered",
        )

    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username, 
        email=user_in.email, 
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user