import sys
sys.path.append('backend')

from app.core.security import get_password_hash, verify_password

# Test password hashing
password = "test1234"
print(f"Testing password: {password}")
print(f"Password length: {len(password)} chars, {len(password.encode('utf-8'))} bytes")

try:
    hashed = get_password_hash(password)
    print(f"\n[OK] Hash generated successfully")
    print(f"Hash: {hashed[:50]}...")

    # Test verification
    is_valid = verify_password(password, hashed)
    print(f"\n[OK] Verification: {is_valid}")

except Exception as e:
    print(f"\n[ERROR] {e}")
    import traceback
    traceback.print_exc()
