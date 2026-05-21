"""
Vercel serverless entry point for the Django backend.
Vercel routes all /api/* requests here; Django handles URL dispatch internally.
"""
import os
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotter.settings')
os.environ.setdefault('ALLOWED_HOSTS', '.vercel.app,localhost,127.0.0.1')
os.environ.setdefault('CORS_ALLOW_ALL_ORIGINS', 'False')  # same-origin on Vercel — no CORS needed
os.environ.setdefault('DEBUG', 'False')

import django
django.setup()

# Run migrations on cold start (Vercel's /tmp is writable and persists across warm invocations)
_db_path = '/tmp/spotter.sqlite3'
os.environ['DB_PATH'] = _db_path

if not os.path.exists(_db_path):
    from django.core.management import call_command
    call_command('migrate', '--run-syncdb', verbosity=0)

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
