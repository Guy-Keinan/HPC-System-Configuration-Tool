#!/usr/bin/env python3
"""
Simple PostgreSQL connection test
"""
import psycopg2
from sqlalchemy import create_engine

print("🔍 Testing PostgreSQL connection...")

# Test 1: Direct psycopg2 connection
print("\n1️⃣ Testing direct psycopg2 connection...")
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5432,
        database="hpc_config",
        user="postgres",
        password="postgres"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"✅ Direct connection successful! PostgreSQL version: {version[0][:50]}...")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Direct connection failed: {e}")

# Test 2: SQLAlchemy connection
print("\n2️⃣ Testing SQLAlchemy connection...")
try:
    engine = create_engine("postgresql://postgres:postgres@127.0.0.1:5432/hpc_config")
    with engine.connect() as conn:
        result = conn.execute("SELECT version();")
        version = result.fetchone()
        print(f"✅ SQLAlchemy connection successful! Version: {version[0][:50]}...")
except Exception as e:
    print(f"❌ SQLAlchemy connection failed: {e}")

# Test 3: Different connection variations
print("\n3️⃣ Testing connection variations...")

variations = [
    "postgresql://postgres:postgres@localhost:5432/hpc_config",
    "postgresql://postgres:postgres@127.0.0.1:5432/hpc_config",
    "postgresql://postgres@127.0.0.1:5432/hpc_config",
]

for i, url in enumerate(variations, 1):
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        print(f"✅ Variation {i} works: {url}")
        break
    except Exception as e:
        print(f"❌ Variation {i} failed: {url} - {e}")

print("\n🏁 Test completed!") 