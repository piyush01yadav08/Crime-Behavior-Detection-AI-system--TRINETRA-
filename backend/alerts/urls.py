from django.urls import path
from .views import (
    AlertListCreateAPIView,
    AlertDetailAPIView,
    ActivityLogListAPIView,
    SystemSettingAPIView,
)

urlpatterns = [
    path("", AlertListCreateAPIView.as_view(), name="alert-list-create"),
    path("<str:alert_id>/", AlertDetailAPIView.as_view(), name="alert-detail"),
]
