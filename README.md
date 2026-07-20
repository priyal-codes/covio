# Covio 🎥💬

Covio is a premium, real-time video conferencing and collaboration platform designed for seamless virtual meetings. Built with a modern stack, it supports high-quality peer-to-peer video streaming, real-time messaging, and an integrated AI meeting assistant.

🚀 **[Covio](https://covio.onrender.com)**

---

## ✨ Features

- **🎥 Peer-to-Peer Calls**: Real-time video/audio streaming powered by **WebRTC** and Google STUN servers.
- **💬 Live Chat**: Instant messaging with other participants directly within the meeting room.
- **🤖 AI Meeting Assistant**: An integrated AI helper to draft agendas, format notes, write code, and summarize discussions.
- **🔑 Secure Meetings**: Instantly generate random, secure meeting codes (e.g., `meet-abc-xyz`) or join existing rooms.
- **🔐 User Auth**: Secure user registration, login, and encrypted credentials.
- **📅 Meeting History**: A sliding drawer dashboard logging your past meetings to quickly rejoin previous sessions.

---

## 🛠️ Tech Stack

| Frontend | Backend & DB | Protocols & security |
| :--- | :--- | :--- |
| • React 19 (Vite) <br>• CSS Modules <br>• Material UI (MUI) <br>• Axios | • Node.js & Express <br>• MongoDB & Mongoose | • Socket.io (Signaling & Chat) <br>• WebRTC (P2P Media) <br>• bcrypt (Auth Encryption) |

---

## 💻 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/priyal-codes/covio.git
   cd covio
   ```

2. **Configure Backend Environment**
   Create a `.env` file inside the `backend` directory:
   ```env
   PORT=8000
   MONGO_URL=your_mongodb_connection_string
   ```

3. **Install Dependencies**
   ```bash
   # Install Backend dependencies
   cd backend && npm install
   
   # Install Frontend dependencies
   cd ../frontend && npm install
   ```

4. **Start Development Servers**
   To run the application, start both the backend and frontend servers:

   * **Start Backend (from backend directory)**:
     ```bash
     npm run dev
     ```
   * **Start Frontend (from frontend directory)**:
     ```bash
     npm run dev
     ```

   - **Frontend URL**: `http://localhost:5173`
   - **Backend URL**: `http://localhost:8000`

---

## ☁️ Deployment (Render)

### 1. Backend (Web Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: `MONGO_URL`

### 2. Frontend (Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: `VITE_BACKEND_URL` (points to your deployed Render backend)
