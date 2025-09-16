# Chat-room

A small Vite + React + TypeScript chat app using Supabase. This project demonstrates system-level problem solving, networking, and concurrency handling, making it a strong portfolio piece.

## Requirements

- Node.js 18+ (or a recent LTS)
- npm
- A Supabase project (for the database and auth)


🚀 Features

Multi-threaded server supporting 100+ concurrent clients

Public chat rooms and private messaging

Authentication using Supabase Auth

Message persistence with Postgres (full chat history)

Typing indicators and live presence detection

Room management (create, join, leave)

Secure and extensible design (future support for encryption & file sharing)

🏗️ Architecture

High-Level Flow:

Client connects to the server via sockets.

Server spawns a dedicated thread/async process for each client.

Messages are routed (broadcast/private) and stored in the database.

Supabase handles authentication and secure persistence.

Optional React/Next.js frontend for a modern UI.

[ Client(s) ] <--> [ Multi-Threaded Server ] <--> [ Supabase/Postgres DB ]

🛠️ Tech Stack

Backend: Java (Threads, Sockets) / Python (Asyncio, Sockets)

Database: Postgres + Supabase (Auth, persistence, RLS policies)

Frontend (Optional): React / Next.js for UI

Deployment: Docker for containerization
