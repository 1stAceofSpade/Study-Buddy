from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from dependencies import SessionDep, require_room_member
from models import Message, RoomInvitation, RoomMember, StudyRoom, User
from schemas import (
    MessageResponse,
    RoomCreate,
    RoomDashboardResponse,
    RoomInvitationResponse,
    RoomJoin,
    RoomResponse,
)
from security import get_current_user, get_password_hash, verify_password

router = APIRouter(tags=["Rooms"])


@router.get("/users/me/rooms", response_model=list[RoomDashboardResponse])
async def get_user_rooms(
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    rooms = db.exec(
        select(StudyRoom)
        .join(RoomMember, RoomMember.room_id == StudyRoom.id)
        .where(RoomMember.user_id == user.id)
        .order_by(StudyRoom.created_at.desc())
    ).all()
    return [
        RoomDashboardResponse(
            id=room.id,
            name=room.name,
            topic=room.topic,
            total_members=room.total_members,
            members=[member.username for member in room.members],
            created_at=room.created_at,
        )
        for room in rooms
    ]


@router.get("/invitations", response_model=list[RoomInvitationResponse])
async def get_room_invitations(
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    invitations = db.exec(
        select(RoomInvitation, StudyRoom, User)
        .join(StudyRoom, StudyRoom.id == RoomInvitation.room_id)
        .join(User, User.id == RoomInvitation.inviter_id)
        .where(
            RoomInvitation.invitee_id == user.id,
            RoomInvitation.status == "pending",
        )
        .order_by(RoomInvitation.created_at.desc())
    ).all()
    return [
        RoomInvitationResponse(
            id=invitation.id,
            room_id=invitation.room_id,
            room_name=room.name,
            room_topic=room.topic,
            inviter_username=inviter.username,
            created_at=invitation.created_at,
        )
        for invitation, room, inviter in invitations
    ]


@router.post("/rooms", response_model=RoomResponse, status_code=201)
async def create_room(
    room: RoomCreate,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    if room.invite_username == user.username:
        raise HTTPException(status_code=400, detail="You cannot invite yourself")

    invitee = None
    if room.invite_username:
        invitee = db.exec(
            select(User).where(User.username == room.invite_username)
        ).first()
        if invitee is None:
            raise HTTPException(status_code=404, detail="Invited user not found")

    required_members = 2 if invitee else 1
    if room.total_members < required_members:
        raise HTTPException(status_code=400, detail="Room capacity is too small")

    new_room = StudyRoom(
        name=room.name,
        topic=room.topic,
        passcode=get_password_hash(room.password.get_secret_value()),
        total_members=room.total_members,
        created_by=user.id,
    )
    db.add(new_room)
    db.flush()
    db.add(RoomMember(user_id=user.id, room_id=new_room.id, role="admin"))
    if invitee:
        db.add(
            RoomInvitation(
                room_id=new_room.id,
                inviter_id=user.id,
                invitee_id=invitee.id,
            )
        )
    db.commit()
    db.refresh(new_room)
    return new_room


@router.post("/rooms/join", status_code=200)
async def join_room(
    join_data: RoomJoin,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    room = db.exec(select(StudyRoom).where(StudyRoom.id == join_data.room_id)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if not verify_password(join_data.password.get_secret_value(), room.passcode):
        raise HTTPException(status_code=401, detail="Incorrect password")

    existing_member = db.exec(
        select(RoomMember).where(
            RoomMember.user_id == user.id,
            RoomMember.room_id == room.id,
        )
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="You are already a member of this room")

    if len(room.members) >= room.total_members:
        raise HTTPException(status_code=400, detail="This study room is full")

    db.add(RoomMember(user_id=user.id, room_id=room.id, role="member"))
    pending_invitation = db.exec(
        select(RoomInvitation).where(
            RoomInvitation.room_id == room.id,
            RoomInvitation.invitee_id == user.id,
            RoomInvitation.status == "pending",
        )
    ).first()
    if pending_invitation:
        pending_invitation.status = "accepted"
        db.add(pending_invitation)
    db.commit()
    return {"message": f"Successfully joined {room.name}"}


@router.delete("/rooms/{room_id}/leave", status_code=200)
async def leave_room(
    room_id: int,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    room = require_room_member(db, room_id, user)
    membership = db.get(RoomMember, (user.id, room_id))
    if membership is None:
        raise HTTPException(status_code=403, detail="You are not a member of this room")
    db.delete(membership)
    db.commit()
    return {"message": f"Successfully left {room.name}"}


@router.post("/invitations/{invitation_id}/accept", status_code=200)
async def accept_room_invitation(
    invitation_id: int,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    invitation = db.get(RoomInvitation, invitation_id)
    if invitation is None or invitation.invitee_id != user.id:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Invitation is no longer pending")

    room = db.get(StudyRoom, invitation.room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    membership = db.exec(
        select(RoomMember).where(
            RoomMember.user_id == user.id,
            RoomMember.room_id == room.id,
        )
    ).first()
    if membership is None:
        if len(room.members) >= room.total_members:
            raise HTTPException(status_code=400, detail="This study room is full")
        db.add(RoomMember(user_id=user.id, room_id=room.id, role="member"))
    invitation.status = "accepted"
    db.add(invitation)
    db.commit()
    return {"message": f"Successfully joined {room.name}", "room_id": room.id}


@router.post("/invitations/{invitation_id}/decline", status_code=200)
async def decline_room_invitation(
    invitation_id: int,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    invitation = db.get(RoomInvitation, invitation_id)
    if invitation is None or invitation.invitee_id != user.id:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Invitation is no longer pending")

    invitation.status = "declined"
    db.add(invitation)
    db.commit()
    return {"message": "Invitation declined"}


@router.get("/rooms/{room_id}/messages", response_model=list[MessageResponse])
async def get_room_messages(
    room_id: int,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    require_room_member(db, room_id, user)
    messages = db.exec(
        select(Message)
        .where(Message.room_id == room_id)
        .order_by(Message.sent_at.desc())
        .limit(100)
    ).all()
    return [
        MessageResponse(
            message_id=message.message_id,
            text=message.text,
            sent_at=message.sent_at,
            sender_username=message.sender.username,
        )
        for message in reversed(messages)
    ]
