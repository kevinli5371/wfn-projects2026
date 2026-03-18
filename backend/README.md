# Viral Market Backend

## Running the server (required for phone to connect)

Start the backend with **`--host 0.0.0.0`** so your phone on the same network can reach it. Without this, the server only listens on localhost and the app will show "Could not connect to server".

```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0
```

Or from project root:

```bash
cd backend && python3 -m uvicorn main:app --reload --host 0.0.0.0
```

## Frontend IP

The app uses the URL in `viral-market/config.ts` (default `http://172.20.10.3:8000`). If your Mac’s IP changes, set `EXPO_PUBLIC_API_URL` in `viral-market/.env` to match (e.g. `http://172.20.10.3:8000`). Use the same IP Expo shows in the terminal (e.g. `exp://172.20.10.3:8081`).
