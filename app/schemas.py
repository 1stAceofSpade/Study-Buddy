from pydantic import BaseModel , EmailStr , Field, SecretStr, model_validator
from datetime import datetime
from fastapi import File , UploadFile

class UserLogin(BaseModel):
    password: str = Field(min_length=8)
    email: EmailStr

class UserRegister(UserLogin):
    username: str = Field(min_length=3 , max_length=20)

class UserInDB(BaseModel):
    username: str
    hashed_password: str
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    joined_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int | None = None
    username: str | None = None

class PdfUpload(BaseModel):
    title: str = Field(max_length=50)
    file: UploadFile = File(...)

    @model_validator(mode='after')
    def validate_pdf(self):
        if self.file.content_type != 'application/pdf':
            raise ValueError('File must be a PDF')
        return self

class RoomCreate(BaseModel):
    name: str = Field(min_length=3, max_length=25)
    password: SecretStr
    topic: str = Field(min_length=3 , max_length=25)
    total_members: int = Field(le=12)
    invite_username: str | None = None

class RoomJoin(BaseModel):
    room_id: int
    password: SecretStr

class RoomResponse(BaseModel):
    id: int
    name: str
    topic: str
    created_by: int
    created_at: datetime


class RoomDashboardResponse(BaseModel):
    id: int
    name: str
    topic: str
    total_members: int
    members: list[str]
    created_at: datetime


class RoomInvitationResponse(BaseModel):
    id: int
    room_id: int
    room_name: str
    room_topic: str
    inviter_username: str
    created_at: datetime


class MessageResponse(BaseModel):
    message_id: int
    text: str
    sent_at: datetime
    sender_username: str

class TodoCreate(BaseModel):
    task: str = Field(min_length=1, max_length=200)

class TodoUpdate(BaseModel):
    is_completed: bool

class TodoResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    task: str
    is_completed: bool
    created_at: datetime

class FriendRequestCreate(BaseModel):
    receiver_username: str 

class FriendResponse(BaseModel):
    sender_id: int
    receiver_id: int
    status: str
    sent_at: datetime

class PomodoroSessionCreate(BaseModel):
    focus_minutes: int = Field(gt=0)