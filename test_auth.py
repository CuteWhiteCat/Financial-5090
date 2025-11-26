import requests
import json

BASE_URL = "http://localhost:8000"

print("="*70)
print("Testing Authentication API")
print("="*70)

# Test 1: Register a new user
print("\n1. Register new user")
print("-"*70)
register_data = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "test1234",
    "full_name": "Test User"
}

try:
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    if response.status_code == 201:
        user = response.json()
        print(f"[OK] User registered successfully")
        print(f"   Username: {user['username']}")
        print(f"   Email: {user['email']}")
        print(f"   Full Name: {user['full_name']}")
    else:
        print(f"[FAIL] Registration failed: {response.status_code}")
        print(f"   {response.text}")
except Exception as e:
    print(f"[ERROR] {e}")

# Test 2: Login
print("\n2. Login")
print("-"*70)
login_data = {
    "username": "testuser",
    "password": "test1234"
}

try:
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=login_data  # OAuth2 uses form data
    )
    if response.status_code == 200:
        result = response.json()
        token = result['access_token']
        user = result['user']
        print(f"[OK] Login successful")
        print(f"   Token: {token[:50]}...")
        print(f"   Username: {user['username']}")
        print(f"   Email: {user['email']}")

        # Save token for later tests
        TOKEN = token
    else:
        print(f"[FAIL] Login failed: {response.status_code}")
        print(f"   {response.text}")
        TOKEN = None
except Exception as e:
    print(f"[ERROR] {e}")
    TOKEN = None

# Test 3: Get current user info
if TOKEN:
    print("\n3. Get current user info")
    print("-"*70)
    try:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print(f"[OK] User info retrieved")
            print(f"   ID: {user['id']}")
            print(f"   Username: {user['username']}")
            print(f"   Email: {user['email']}")
        else:
            print(f"[FAIL] Failed to get user info: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")

# Test 4: Create a strategy with authentication
if TOKEN:
    print("\n4. Create strategy (with authentication)")
    print("-"*70)
    try:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        strategy_data = {
            "name": "Test MA Strategy",
            "description": "Test strategy with auth",
            "strategy_type": "moving_average",
            "initial_capital": 100000,
            "short_period": 5,
            "long_period": 20
        }
        response = requests.post(
            f"{BASE_URL}/api/strategies/",
            json=strategy_data,
            headers=headers
        )
        if response.status_code == 200:
            strategy = response.json()
            print(f"[OK] Strategy created")
            print(f"   ID: {strategy['id']}")
            print(f"   Name: {strategy['name']}")
            print(f"   User ID: {strategy['user_id']}")
        else:
            print(f"[FAIL] Failed to create strategy: {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

# Test 5: Get user strategies
if TOKEN:
    print("\n5. Get user strategies")
    print("-"*70)
    try:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        response = requests.get(f"{BASE_URL}/api/strategies/", headers=headers)
        if response.status_code == 200:
            strategies = response.json()
            print(f"[OK] Retrieved {len(strategies)} strategies")
            for s in strategies:
                print(f"   - {s['name']} ({s['strategy_type']})")
        else:
            print(f"[FAIL] Failed to get strategies: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")

print("\n" + "="*70)
print("Authentication tests completed!")
print("="*70)
