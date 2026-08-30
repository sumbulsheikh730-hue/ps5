#!/usr/bin/env python3
"""
PRAKRITI Setup Script – Run this to verify your environment is ready.
"""

import sys
import subprocess

def check(name, import_name=None):
    try:
        __import__(import_name or name)
        print(f"  ✓ {name}")
        return True
    except ImportError:
        print(f"  ✗ {name} — run: pip install {name}")
        return False

print("\n=== PRAKRITI Environment Check ===\n")
print("Python:", sys.version)

print("\nRequired packages:")
ok = all([
    check("fastapi"),
    check("uvicorn"),
    check("sqlalchemy"),
    check("aiosqlite"),
    check("pydantic"),
    check("pydantic_settings"),
    check("multipart", "python_multipart"),
    check("aiofiles"),
    check("dotenv", "dotenv"),
])

if ok:
    print("\n✅ All dependencies found. Run: uvicorn app.main:app --reload --port 8000")
else:
    print("\n❌ Missing dependencies. Run: pip install -r requirements.txt")
