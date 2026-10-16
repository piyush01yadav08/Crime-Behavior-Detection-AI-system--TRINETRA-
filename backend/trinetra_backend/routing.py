from django.urls import path
from surveillance.consumers import SurveillanceConsumer

websocket_urlpatterns = [
    path("ws/surveillance/", SurveillanceConsumer.as_asgi()),
]
