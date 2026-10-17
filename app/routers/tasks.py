from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from dependencies import SessionDep, require_room_member
from models import PomodoroStat, TodoItem, User
from schemas import (
    PomodoroSessionCreate,
    TodoCreate,
    TodoResponse,
    TodoUpdate,
)
from security import get_current_user

router = APIRouter(tags=["Study tools"])


@router.get("/rooms/{room_id}/tasks", response_model=list[TodoResponse])
async def get_room_tasks(
    room_id: int,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    require_room_member(db, room_id, user)
    return db.exec(
        select(TodoItem)
        .where(TodoItem.room_id == room_id)
        .order_by(TodoItem.created_at)
    ).all()


@router.post("/rooms/{room_id}/tasks", response_model=TodoResponse, status_code=201)
async def create_room_task(
    room_id: int,
    task_data: TodoCreate,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    require_room_member(db, room_id, user)
    task_text = task_data.task.strip()
    if not task_text:
        raise HTTPException(status_code=422, detail="Task cannot be blank")
    task = TodoItem(room_id=room_id, user_id=user.id, task=task_text)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch(
    "/rooms/{room_id}/tasks/{task_id}",
    response_model=TodoResponse,
)
async def update_room_task(
    room_id: int,
    task_id: int,
    task_data: TodoUpdate,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    require_room_member(db, room_id, user)
    task = db.exec(
        select(TodoItem).where(
            TodoItem.id == task_id,
            TodoItem.room_id == room_id,
        )
    ).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_completed = task_data.is_completed
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.post("/rooms/{room_id}/pomodoro", status_code=201)
async def log_pomodoro_session(
    room_id: int,
    session_data: PomodoroSessionCreate,
    db: SessionDep,
    user: User = Depends(get_current_user),
):
    require_room_member(db, room_id, user)
    session_stat = PomodoroStat(
        room_id=room_id,
        user_id=user.id,
        focus_minutes=session_data.focus_minutes,
    )
    db.add(session_stat)
    db.commit()
    db.refresh(session_stat)
    return {
        "message": "Pomodoro session logged!",
        "minutes": session_stat.focus_minutes,
    }
