from typing import Annotated

from fastapi import Depends, HTTPException
from sqlmodel import Session, select

from databases import get_session
from models import RoomMember, StudyRoom, User

SessionDep = Annotated[Session, Depends(get_session)]


def require_room_member(db: Session, room_id: int, user: User) -> StudyRoom:
    room = db.get(StudyRoom, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    membership = db.exec(
        select(RoomMember).where(
            RoomMember.user_id == user.id,
            RoomMember.room_id == room_id,
        )
    ).first()
    if membership is None:
        raise HTTPException(status_code=403, detail="You are not a member of this room")
    return room
