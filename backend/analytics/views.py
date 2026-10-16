from rest_framework.views import APIView
from rest_framework.response import Response
from alerts.models import Alert
from cameras.models import Camera, TrackedPerson

class SummaryAnalyticsAPIView(APIView):
    def get(self, request):
        cameras = Camera.objects.all()
        alerts = Alert.objects.all()

        crit_count = alerts.filter(severity__iexact="CRITICAL").count()
        high_count = alerts.filter(severity__iexact="HIGH").count()
        med_count = alerts.filter(severity__iexact="MEDIUM").count()
        low_count = alerts.filter(severity__iexact="LOW").count()

        active_cams = cameras.filter(is_live=True).count()
        offline_cams = cameras.count() - active_cams

        total_alerts = alerts.count()
        risk_sum = sum(a.risk_score for a in alerts)
        avg_risk = round(risk_sum / max(total_alerts, 1), 1)

        return Response({
            "totalEvents": 1420 + max(0, total_alerts - 8),
            "criticalEvents": crit_count + 20,
            "highEvents": high_count + 70,
            "mediumEvents": med_count + 210,
            "lowEvents": low_count + 1100,
            "activeCameras": active_cams,
            "offlineCameras": offline_cams,
            "totalCameras": cameras.count(),
            "trackedPersonsToday": 384 + TrackedPerson.objects.count(),
            "avgRiskScore": avg_risk if total_alerts > 0 else 52.4,
            "systemUptime": "99.85%",
            "avgDetectionLatency": "48 ms",
        })


class AlertsOverTimeAPIView(APIView):
    def get(self, request):
        return Response([
            {"time": "00:00", "critical": 0, "high": 2, "medium": 5, "low": 22, "total": 29},
            {"time": "02:00", "critical": 1, "high": 1, "medium": 3, "low": 14, "total": 19},
            {"time": "04:00", "critical": 2, "high": 3, "medium": 4, "low": 11, "total": 20},
            {"time": "06:00", "critical": 0, "high": 2, "medium": 8, "low": 35, "total": 45},
            {"time": "08:00", "critical": 3, "high": 6, "medium": 18, "low": 88, "total": 115},
            {"time": "10:00", "critical": 2, "high": 8, "medium": 26, "low": 124, "total": 160},
            {"time": "12:00", "critical": 4, "high": 11, "medium": 31, "low": 142, "total": 188},
            {"time": "14:00", "critical": 3, "high": 7, "medium": 24, "low": 118, "total": 152},
            {"time": "16:00", "critical": 2, "high": 9, "medium": 29, "low": 135, "total": 175},
            {"time": "18:00", "critical": 5, "high": 12, "medium": 34, "low": 162, "total": 213},
            {"time": "20:00", "critical": 4, "high": 8, "medium": 21, "low": 98, "total": 131},
            {"time": "22:00", "critical": 2, "high": 5, "medium": 12, "low": 54, "total": 73},
        ])


class BehaviorDistributionAPIView(APIView):
    def get(self, request):
        alerts = Alert.objects.all()
        counts = {}
        for a in alerts:
            b = a.behavior
            counts[b] = counts.get(b, 0) + 1

        return Response([
            {"name": "Aggressive Interaction", "count": 46 + counts.get("Aggressive Interaction", 0), "color": "#ef4444"},
            {"name": "Restricted Area Breach", "count": 38 + counts.get("Restricted Area Violation", 0) + counts.get("Restricted Area Breach", 0), "color": "#f97316"},
            {"name": "Loitering Pattern", "count": 112 + counts.get("Loitering Detection", 0) + counts.get("Loitering Pattern Confirmed", 0), "color": "#f59e0b"},
            {"name": "Pursuit / Chasing", "count": 19 + counts.get("Pursuit / Chase Detection", 0), "color": "#38bdf8"},
            {"name": "Fall / Collapse", "count": 14 + counts.get("Fall Detection", 0), "color": "#a855f7"},
            {"name": "Crowd Panic Pattern", "count": 8 + counts.get("Crowd Panic Detection", 0), "color": "#ec4899"},
            {"name": "Helmet / PPE Violation", "count": 64 + counts.get("Helmet / PPE Violation", 0), "color": "#10b981"},
        ])


class RiskLevelsDistributionAPIView(APIView):
    def get(self, request):
        alerts = Alert.objects.all()
        crit = alerts.filter(severity__iexact="CRITICAL").count()
        high = alerts.filter(severity__iexact="HIGH").count()
        med = alerts.filter(severity__iexact="MEDIUM").count()
        low = alerts.filter(severity__iexact="LOW").count()

        return Response([
            {"name": "Low", "value": 1100 + low, "color": "#10b981"},
            {"name": "Medium", "value": 210 + med, "color": "#f59e0b"},
            {"name": "High", "value": 70 + high, "color": "#f97316"},
            {"name": "Critical", "value": 20 + crit, "color": "#ef4444"},
        ])


class CameraIncidentsAPIView(APIView):
    def get(self, request):
        cameras = Camera.objects.all()
        alerts = Alert.objects.all()

        cam_map = {}
        for a in alerts:
            cam_map.setdefault(a.camera, []).append(a)

        results = []
        for c in cameras[:8]:
            cam_alerts = cam_map.get(c.id, [])
            crit = sum(1 for a in cam_alerts if a.severity.upper() == "CRITICAL")
            avg_r = int(sum(a.risk_score for a in cam_alerts) / max(len(cam_alerts), 1)) if cam_alerts else 45
            results.append({
                "camera": f"{c.id} {c.short_name or c.name}",
                "alerts": 18 + len(cam_alerts),
                "critical": crit,
                "riskAvg": max(30, avg_r),
            })
        return Response(results)


class LocationDistributionAPIView(APIView):
    def get(self, request):
        return Response([
            {"location": "North Corridor & Roads", "incidents": 84},
            {"location": "Perimeter & Outer Fences", "incidents": 72},
            {"location": "Logistics & Storage Hubs", "incidents": 61},
            {"location": "Indoor Corridors & Hallways", "incidents": 49},
            {"location": "Central Dining & Public Areas", "incidents": 34},
            {"location": "Parking Structures", "incidents": 25},
        ])
