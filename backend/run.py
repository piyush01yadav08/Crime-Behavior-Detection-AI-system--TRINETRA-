#!/usr/bin/env python
import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "trinetra_backend.settings")

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    print("=" * 65)
    print("👁️ TRINETRA AI SURVEILLANCE PLATFORM")
    print("Backend:   Django 5.x + Django REST Framework")
    print("Realtime:  Django Channels & WebSockets (Daphne ASGI)")
    print("Database:  PostgreSQL")
    print(f"Server:    http://{host}:{port}")
    print(f"WebSocket: ws://{host}:{port}/ws/surveillance/")
    print("=" * 65)

    # Use daphne ASGI server to serve both HTTP and Django Channels WebSockets
    try:
        from daphne.cli import CommandLineInterface
        sys.argv = ["daphne", "-b", host, "-p", str(port), "trinetra_backend.asgi:application"]
        CommandLineInterface().run(sys.argv[1:])
    except Exception as exc:
        print(f"[Notice] Falling back to Django runserver: {exc}")
        from django.core.management import execute_from_command_line
        execute_from_command_line(["manage.py", "runserver", f"{host}:{port}"])
