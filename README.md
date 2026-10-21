# PulseChat: Chat Frontend (v1)

The original React client for the [chat-application](https://github.com/Mohd-Furkhan-lab/chat-application) FastAPI backend. PulseChat is a focused, **one-to-one real-time messaging** interface with a glassmorphism look, live WebSocket delivery and sound cues.

**Live demo:** https://chat-frontend-gilt-phi.vercel.app

> **Want groups, file sharing, voice notes and profile pictures?** Those arrived in the next generation: [`chat_applciation_v2`](https://github.com/Mohd-Furkhan-lab/chat_applciation_v2) (Thread). This repo is the stable, DM-only v1.

---

## Features

- **Sign in / create account:** email and password, with an auto-generated username assigned at signup
- **Persistent sessions:** your login is restored on page load, and expired tokens are refreshed automatically
- **Direct messaging:** one-to-one conversations with full message history
- **Add contacts by username:** start a chat from the *New Conversation* dialog, and re-opening an existing chat works seamlessly
- **Live delivery over WebSocket:** incoming messages appear instantly
- **Auto-reconnect:** the socket reconnects when the tab regains focus, the network comes back, or the connection drops, and a status bar shows whether you are live
- **Optimistic sending:** your message appears the moment you press send
- **Offline awareness:** you are told when the recipient is offline
- **Toast notifications:** a "New message from…" toast appears for chats you are not viewing, and tapping it opens the conversation
- **Sound cues:** short synthesized chimes for sending and receiving, generated with the Web Audio API (no audio files)
- **Search:** filter your conversation list as you type
- **Clear chat:** delete a conversation's history with a confirmation
- **Generated avatars:** colorful gradient avatars with the user's initial
- **Responsive layout:** sidebar and chat views switch cleanly on small screens
- **Modern UI:** glass panels over an animated glow background

## Tech Stack

- **React** with hooks
- **Vite** for dev server and build
- **Web APIs:** WebSocket, Web Audio
- Plain CSS (no UI framework)

## Backend Compatibility

PulseChat expects the contact list to be returned as plain usernames, which is the API shape on the **`backend` branch** of [chat-application](https://github.com/Mohd-Furkhan-lab/chat-application). The `main` branch returns richer contact objects (with profile pictures) and adds group endpoints, so use [Thread (v2)](https://github.com/Mohd-Furkhan-lab/chat_applciation_v2) with `main`.

## Getting Started

### Prerequisites

- A current **Node.js LTS** (20+)
- The backend running (default `http://localhost:8000`)

### Run locally

```bash
git clone https://github.com/Mohd-Furkhan-lab/chat_frontend.git
cd chat_frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Configuration

Create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the REST API. |
| `VITE_WS_URL` | Base URL of the WebSocket server (use `wss://` when the API is on HTTPS). |

Both are required, because the app does not fall back to defaults.

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Deployment Notes

- Set `VITE_API_URL` and `VITE_WS_URL` before building.
- Add your frontend's origin to the backend's CORS `allow_origins` list (in `run.py`).
- The backend sets `Secure; SameSite=None` cookies, so a deployed frontend and API should both use **HTTPS**.

## Project Structure

```text
chat_frontend/
├── src/
│   ├── App.jsx        # auth screen, chat dashboard, toasts
│   ├── api.js         # API client with automatic token refresh
│   ├── sound.js       # Web Audio chime generator
│   ├── main.jsx       # React entry point
│   └── styles.css     # styling
├── index.html
├── vite.config.js     # dev server on port 3000
└── package.json
```

## API Surface Used

| Area | Endpoints |
|---|---|
| Users | `/users/signup`, `/users/login`, `/users/logout`, `/users/refresh`, `/users/me` |
| Chats | `/chat/contacts`, `/chat/{username}`, `/chat/send-msg`, `/chat/clear-chat/{username}` |
| WebSocket | `/ws/connect` |

## v1 vs v2 at a Glance

| | PulseChat (v1) | Thread (v2) |
|---|---|---|
| Direct messages | ✅ | ✅ |
| Group chats and admin tools | | ✅ |
| Images, files and voice notes | | ✅ |
| Profile pictures | | ✅ |
| Unread badges and desktop notifications | | ✅ |
| Backend branch | `backend` | `main` |

## Contributing

Issues and pull requests are welcome. Please open a branch and describe the change clearly.

## License

No license file is included yet. Add one (for example MIT) to define how others may use this code.
