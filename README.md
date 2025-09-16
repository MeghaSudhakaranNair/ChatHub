# ChatHub Documentation

## Overview

ChatHub is a real-time chat application built to enable seamless live conversations across multiple chat rooms. Users can create, join, and participate in chat rooms, sending and receiving messages instantly. The app reflects real-time updates such as new messages and online users using WebSockets (Socket.IO) for bi-directional communication.

## Architecture

- **Frontend:** Developed with Next.js and React, using the new app directory and hooks for state management and side effects. Material UI components provide the user interface. Authentication is handled via Google OAuth.
- **Backend:** Node.js with Express handles REST APIs and Socket.IO for real-time event handling. Prisma ORM manages database access with PostgreSQL (or another supported SQL DB).
- **Authentication:** Google OAuth integration, with JWT tokens stored in HTTP-only cookies for session security.
- **Real-time:** Socket.IO manages joining/leaving rooms, broadcasting messages, and tracking online users.
- **Database:** Prisma manages user, room, membership, and message persistence with transactions where needed.

## Database
1. Room - Table to store all the rooms available
<img width="408" height="174" alt="Screenshot 2025-09-16 at 2 55 25 AM" src="https://github.com/user-attachments/assets/9ecb8edb-6ee3-4049-9bef-1ced6919ef79" />

2. UserOnRoom - Mapping between the user and the room
<img width="455" height="293" alt="Screenshot 2025-09-16 at 2 55 59 AM" src="https://github.com/user-attachments/assets/167dc0af-93f6-4e9d-9fe5-ed6315101920" />

3. User - Stores the user's email, name, and profile photo from google-auth, an  optional field for password for future use
<img width="866" height="124" alt="Screenshot 2025-09-16 at 2 55 46 AM" src="https://github.com/user-attachments/assets/f7d85ed4-2102-4dd2-b2b5-d32f5250e589" />

4. Messages - Mapping between the message, user, and room
<img width="585" height="159" alt="Screenshot 2025-09-16 at 2 55 11 AM" src="https://github.com/user-attachments/assets/0ef2b964-6341-4fba-95b1-5e0c0c25dbc2" />




## Core Features

- User authentication via Google OAuth.
- Create and join chat rooms dynamically.
- Real-time messaging with message broadcasting through WebSockets.
- Display of online users per chat room.
- Stateful UI that updates instantly on new events without page reloads.
- Secure API endpoints with JWT authentication middleware.
- Input validation with Zod schemas to guarantee data integrity.

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL (or compatible database)
- Google Cloud project with OAuth client ID

### Backend Setup

1. Create `.env` file with necessary environment variables
2. Install dependencies
3. Run Prisma migrations to set up the database schema
4. Start the backend server
   The backend will run at `http://localhost:5001`

### Frontend Setup

1. Create a `.env.local` file in the frontend project root and add:
2. Install dependencies
3. Start the frontend development server
4. The frontend will be accessible at `http://localhost:3000`

### Running the Application

- Open your browser and navigate to `http://localhost:3000`
- Use the Google Login button to authenticate.
- Once logged in, create or join chat rooms and start chatting in real-time.
- Open multiple browser windows or tabs to observe live message and user presence updates.

---

## Environment Variables Summary

### server

DATABASE_URL Database connection string Backend .env
JWT_SECRET JWT secret for signing authentication tokens Backend .env

### client

NEXT_PUBLIC_GOOGLE_CLIENT_ID Google OAuth Client ID exposed to frontend Frontend

## Future Improvements

### Frontend

1. Responsiveness and bug fixes if any
2. UI Enhancements - Make the UI a little more modern
3. Sort chatrooms based on timestamp

### Backend

1. Unit testing
2. Add LLM - when user types @assistant and give message fetch automated response using LLM

### General

1. Code cleanup

## Demo
