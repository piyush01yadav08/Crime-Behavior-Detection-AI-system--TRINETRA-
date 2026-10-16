from django.urls import path
from .views import (
    CameraListCreateAPIView,
    CameraDetailAPIView,
    TrackedPersonListCreateAPIView,
    TrackedPersonDetailAPIView,
)

urlpatterns = [
    path("", CameraListCreateAPIView.as_view(), name="camera-list-create"),
    path("<str:camera_id>/", CameraDetailAPIView.as_view(), name="camera-detail"),
]
