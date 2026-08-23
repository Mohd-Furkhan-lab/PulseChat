# Chat frontend

Minimal React frontend for the FastAPI backend in the parent directory.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The backend must be running on `http://localhost:8000`.

To change the API URL, add a `frontend/.env.local` file:

```env
VITE_API_URL=http://localhost:8000
```
