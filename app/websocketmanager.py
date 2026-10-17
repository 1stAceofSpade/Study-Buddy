from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
    async def connect(self, conversation_id: int, websocket: WebSocket):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, conversation_id: int, websocket: WebSocket):
        if conversation_id not in self.active_connections:
            return

        if websocket in self.active_connections[conversation_id]:
            self.active_connections[conversation_id].remove(websocket)

        if not self.active_connections[conversation_id]:
            del self.active_connections[conversation_id]
    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, conversation_id: int, message: dict):
        connections = list(self.active_connections.get(conversation_id, []))
        for connection in connections:
            try:
                await connection.send_json(message)
            except (WebSocketDisconnect, RuntimeError):
                self.disconnect(conversation_id, connection)

    def connection_count(self, conversation_id: int) -> int:
        return len(self.active_connections.get(conversation_id, []))

manager = ConnectionManager()