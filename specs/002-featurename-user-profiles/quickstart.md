# Phase 1 Quickstart: Testing User Profiles

## 1. Running Unit Tests
Execute the authentication & profile test suite:
```powershell
pytest backend/tests/test_fullstack_features.py -k "test_profile"
```

## 2. API Manual Verification (curl)
1. **Register or login to obtain a JWT token:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password123"}'
   ```
2. **Fetch Profile:**
   ```bash
   curl http://localhost:8000/api/auth/profile \
     -H "Authorization: Bearer <TOKEN>"
   ```
3. **Update Profile & Preferences:**
   ```bash
   curl -X PUT http://localhost:8000/api/auth/profile \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"display_name": "Ross Deb", "bio": "AI Systems Engineer", "preferences": {"theme": "dark", "persona": "architect"}}'
   ```
