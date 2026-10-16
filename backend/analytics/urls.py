from django.urls import path
from .views import (
    SummaryAnalyticsAPIView,
    AlertsOverTimeAPIView,
    BehaviorDistributionAPIView,
    RiskLevelsDistributionAPIView,
    CameraIncidentsAPIView,
    LocationDistributionAPIView,
)

urlpatterns = [
    path("summary/", SummaryAnalyticsAPIView.as_view(), name="analytics-summary"),
    path("alerts-over-time/", AlertsOverTimeAPIView.as_view(), name="analytics-alerts-over-time"),
    path("behaviors/", BehaviorDistributionAPIView.as_view(), name="analytics-behaviors"),
    path("risk-levels/", RiskLevelsDistributionAPIView.as_view(), name="analytics-risk-levels"),
    path("camera-incidents/", CameraIncidentsAPIView.as_view(), name="analytics-camera-incidents"),
    path("locations/", LocationDistributionAPIView.as_view(), name="analytics-locations"),
]
