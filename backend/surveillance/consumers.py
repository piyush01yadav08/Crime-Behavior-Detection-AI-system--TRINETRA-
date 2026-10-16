import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class SurveillanceConsumer(AsyncWebsocketConsumer):
    GROUP_NAME = "surveillance_feed"

    async def connect(self):
        # Join broadcast room group
        await self.channel_layer.group_add(
            self.GROUP_NAME,
            self.channel_name
        )
        await self.accept()
        logger.info(f"[Django Channels] WebSocket client connected: {self.channel_name}")
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to TRINETRA AI Surveillance WebSocket",
            "channel": self.channel_name,
        }))

    async def disconnect(self, close_code):
        # Leave broadcast room group
        await self.channel_layer.group_discard(
            self.GROUP_NAME,
            self.channel_name
        )
        logger.info(f"[Django Channels] WebSocket client disconnected: {self.channel_name}")

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or "{}")
            msg_type = data.get("type", "ping")

            if msg_type == "ping":
                await self.send(text_data=json.dumps({"type": "pong", "payload": "active"}))
            else:
                # Echo / handle client events
                await self.send(text_data=json.dumps({
                    "type": f"{msg_type}_ack",
                    "status": "received",
                }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")

    async def surveillance_message(self, event):
        """Broadcast handler called when channel_layer.group_send fires."""
        event_type = event.get("event_type", "message")
        payload = event.get("payload", {})
        await self.send(text_data=json.dumps({
            "type": event_type,
            "payload": payload,
        }))
