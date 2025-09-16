# Chat-room

A small Vite + React + TypeScript chat app using Supabase.

🚀 Features

Multi-threaded server supporting 100+ concurrent clients

Public chat rooms and private messaging

Authentication using Supabase Auth

Message persistence with Postgres (full chat history)

Typing indicators and live presence detection

Room management (create, join, leave)

Secure and extensible design (future support for encryption & file sharing)

## Requirements

- Node.js 18+ (or a recent LTS)
- npm
- A Supabase project (for the database and auth)

🛠️ Tech Stack

Backend: Java (Threads, Sockets) / Python (Asyncio, Sockets)

Database: Postgres + Supabase (Auth, persistence, RLS policies)

Frontend (Optional): React / Next.js for UI

Deployment: Docker for containerization

chat-app/
│── src/
│   ├── App.tsx                # React/Next.js frontend (optional)
│   ├── server/                 # Multi-threaded chat server
│   │   ├── ChatServer.java     # Core server logic (threads, sockets)
│   │   ├── ClientHandler.java  # Handles client messages
│   ├── client/                 # Client application
│   │   ├── ChatClient.java     # Client logic
│   └── utils/
│       ├── dateUtils.ts        # Utilities for formatting timestamps
│
│── supabase/
│   ├── migrations/
│   │   └── create_chat_schema.sql   # Database schema for messages/users
│
│── README.md
