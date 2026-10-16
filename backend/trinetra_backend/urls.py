import time
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.db import connection
from cameras.views import TrackedPersonListCreateAPIView, TrackedPersonDetailAPIView
from alerts.views import ActivityLogListAPIView, SystemSettingAPIView
from cameras.models import Camera, TrackedPerson
from alerts.models import Alert, ActivityLog, SystemSetting

def health_check(request):
    db_ok = True
    latency_ms = 0.0
    t0 = time.perf_counter()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    except Exception:
        db_ok = False

    return JsonResponse({
        "status": "healthy" if db_ok else "degraded",
        "service": "TRINETRA AI Surveillance Backend (Django + Channels)",
        "version": "2.0.0",
        "techStack": {
            "framework": "Django 5 / Django REST Framework",
            "websockets": "Django Channels / Daphne ASGI",
            "database": getattr(settings, "ACTIVE_DB_DIALECT", "postgresql"),
            "computerVision": "YOLOv8 + OpenCV + DeepSORT",
        },
        "database": {
            "connected": db_ok,
            "status": "ONLINE" if db_ok else "OFFLINE",
            "dialect": getattr(settings, "ACTIVE_DB_DIALECT", "postgresql"),
            "latencyMs": latency_ms,
            "tables": {
                "cameras": Camera.objects.count() if db_ok else 0,
                "alerts": Alert.objects.count() if db_ok else 0,
                "tracked_persons": TrackedPerson.objects.count() if db_ok else 0,
                "activity_logs": ActivityLog.objects.count() if db_ok else 0,
                "system_settings": SystemSetting.objects.count() if db_ok else 0,
            }
        }
    })

def db_status_view(request):
    health = health_check(request)
    import json
    data = json.loads(health.content)
    return JsonResponse(data["database"])

def root_api(request):
    return JsonResponse({
        "name": "TRINETRA AI Surveillance System",
        "description": "Django REST Framework & Django Channels Backend",
        "techStack": {
            "backend": "Django + Django REST Framework",
            "realtime": "Django Channels WebSockets (ws://localhost:8000/ws/surveillance/)",
            "database": "PostgreSQL",
            "cv": "OpenCV, YOLOv8, DeepSORT",
        },
        "endpoints": {
            "cameras": "/api/v1/cameras/",
            "alerts": "/api/v1/alerts/",
            "analytics": "/api/v1/analytics/summary/",
            "persons": "/api/v1/persons/",
            "activity": "/api/v1/activity/",
            "settings": "/api/v1/settings/",
            "db_status": "/api/v1/db/status",
            "live_stream": "/api/v1/stream/live",
            "stream_telemetry": "/api/v1/stream/telemetry",
            "ai_status": "/api/v1/stream/ai/status",
            "health": "/api/health",
        }
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", root_api, name="api-root"),
    path("api/health", health_check, name="api-health"),
    path("api/v1/db/status", db_status_view, name="db-status"),
    # Domain APIs
    path("api/v1/cameras/", include("cameras.urls")),
    path("api/v1/alerts/", include("alerts.urls")),
    path("api/v1/analytics/", include("analytics.urls")),
    path("api/v1/stream/", include("surveillance.urls")),
    # Search / Persons
    path("api/v1/persons/", TrackedPersonListCreateAPIView.as_view(), name="persons-list"),
    path("api/v1/persons/<str:tracking_id>/", TrackedPersonDetailAPIView.as_view(), name="person-detail"),
    # Activity & Settings
    path("api/v1/activity/", ActivityLogListAPIView.as_view(), name="activity-feed"),
    path("api/v1/settings/", SystemSettingAPIView.as_view(), name="settings-all"),
    path("api/v1/settings/<str:key>/", SystemSettingAPIView.as_view(), name="settings-key"),
]
