import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from databases import get_session
from dependencies import require_room_member
from models import Message
from security import authenticate_user
from websocketmanager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/rooms/{room_id}")
async def room_websocket(
    websocket: WebSocket,
    room_id: int,
    token: Annotated[str | None, Query()] = None,
    db: Session = Depends(get_session),
):
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return

    try:
        user = authenticate_user(token, db)
        require_room_member(db, room_id, user)
    except HTTPException as error:
        reason = "Room access denied" if error.status_code == 403 else "Invalid credentials or room"
        await websocket.close(code=1008, reason=reason)
        return

    await manager.connect(room_id, websocket)
    await manager.broadcast(
        room_id,
        {"type": "system", "sender": "System", "text": f"{user.username} joined the study session"},
    )
    await manager.broadcast(
        room_id,
        {"type": "presence", "active_members": manager.connection_count(room_id)},
    )

    try:
        while True:
            text = (await websocket.receive_text()).strip()
            if not text:
                continue
            if len(text) > 2000:
                await websocket.send_json(
                    {"type": "error", "text": "Messages must be 2000 characters or fewer"}
                )
                continue

            message = Message(text=text, room_id=room_id, sender_id=user.id)
            db.add(message)
            try:
                db.commit()
                db.refresh(message)
            except SQLAlchemyError:
                db.rollback()
                logger.exception("Failed to persist a room message")
                await websocket.close(code=1011, reason="Unable to save message")
                break

            await manager.broadcast(
                room_id,
                {
                    "type": "message",
                    "message_id": message.message_id,
                    "sender": user.username,
                    "text": message.text,
                    "sent_at": message.sent_at.isoformat(),
                },
            )
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(
            room_id,
            {"type": "system", "sender": "System", "text": f"{user.username} left the room"},
        )
        await manager.broadcast(
            room_id,
            {"type": "presence", "active_members": manager.connection_count(room_id)},
        )
