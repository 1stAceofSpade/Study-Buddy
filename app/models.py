from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

class RoomMember(SQLModel, table=True):
    __tablename__ = "room_members"

    user_id: int = Field(foreign_key="users.id", primary_key=True)
    room_id: int = Field(foreign_key="study_rooms.id", primary_key=True)
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    role: str = Field(default="member")


class RoomInvitation(SQLModel, table=True):
    __tablename__ = "room_invitations"

    id: Optional[int] = Field(default=None, primary_key=True)
    room_id: int = Field(foreign_key="study_rooms.id", index=True)
    inviter_id: int = Field(foreign_key="users.id")
    invitee_id: int = Field(foreign_key="users.id", index=True)
    status: str = Field(default="pending", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Friend(SQLModel, table=True):
    __tablename__ = "friends"

    sender_id: int = Field(foreign_key="users.id", primary_key=True)
    receiver_id: int = Field(foreign_key="users.id", primary_key=True)
    status: str = Field(default="pending")
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # User sends MANY messages 
    messages: List["Message"] = Relationship(back_populates="sender")
    
    # User owns MANY rooms 
    rooms_owned: List["StudyRoom"] = Relationship(back_populates="creator")
    
    # User joins MANY rooms (via RoomMember)
    joined_rooms: List["StudyRoom"] = Relationship(
        back_populates="members", 
        link_model=RoomMember
    )


class StudyRoom(SQLModel, table=True):
    __tablename__ = "study_rooms"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Untitled Room")
    passcode: str = Field(index=True)
    created_by: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    #Room has ONE creator
    creator: "User" = Relationship(back_populates="rooms_owned")
    
    # Room holds MANY messages
    messages: List["Message"] = Relationship(back_populates="room")
    
    # Room has MANY members (via RoomMember)
    members: List["User"] = Relationship(
        back_populates="joined_rooms", 
        link_model=RoomMember
    )

    topic: str
    total_members: int = Field(le=12)


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    message_id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id")
    room_id: int = Field(foreign_key="study_rooms.id", index=True)
    text: str
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Message has ONE sender
    sender: "User" = Relationship(back_populates="messages")
    
    # Message belongs to ONE room
    room: "StudyRoom" = Relationship(back_populates="messages")

class TodoItem(SQLModel, table=True):
    __tablename__ = "todo_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    room_id: int = Field(foreign_key="study_rooms.id", index=True)
    user_id: int = Field(foreign_key="users.id")
    task: str
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PomodoroStat(SQLModel, table=True):
    __tablename__ = "pomodoro_stats"

    id: Optional[int] = Field(default=None, primary_key=True)
    room_id: int = Field(foreign_key="study_rooms.id", index=True)
    user_id: int = Field(foreign_key="users.id")
    focus_minutes: int = Field(default=25)
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))