# Covio 🎥💬

Covio is a real-time video conferencing and collaboration platform designed to provide seamless, high-quality virtual meetings. Built with a modern tech stack supporting peer-to-peer video streaming, real-time messaging, and an integrated AI meeting assistant, Covio makes remote collaboration easy and engaging.

## 🚀 Live Link
🔗 **[Launch Covio Live App](https://covio.onrender.com)**

---

## ✨ Features
* **Seamless Video & Audio Calls**: Real-time peer-to-peer video/audio streaming powered by **WebRTC** and Google's STUN servers.
* **Real-Time Interactive Chat**: Chat with other participants in the meeting room.
* **AI Meeting Assistant**: An integrated helper that drafts meeting agendas, formats notes templates, writes code snippets, and summarizes discussions on command.
* **Meeting Code Generator**: Instantly generate random, secure meeting codes (e.g. `meet-abc-xyz`) or join existing rooms.
* **User Authentication**: Secure user registration and login with encrypted credentials.
* **Meeting History**: A drawer UI dashboard that logs your past meeting history so you can quickly rejoin previous sessions.

---

## 🛠️ Tech Stack

### **Frontend**
* **Library**: React 19 (built with Vite for lightning-fast speeds)
* **Styling & UI**: CSS Modules & Material UI (MUI Icons & Components)
* **Routing**: React Router DOM (v7)
* **API Requests**: Axios
* **Real-time Engine**: `socket.io-client`

### **Backend**
* **Runtime & Framework**: Node.js & Express (v5)
* **Database**: MongoDB (connected using Mongoose)
* **Real-time Signaling**: `socket.io`
* **Authentication**: Password encryption using `bcrypt`

---

## 💻 Running Locally

### Prerequisites
* [Node.js](https://nodejs.org/) installed
* [MongoDB](https://www.mongodb.com/) (either running locally or a MongoDB Atlas URI)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/priyal-codes/covio.git
   cd covio
   ```

2. **Configure Backend Environment Variables:**
   Create a `.env` file inside the `/backend` folder:
   ```env
   PORT=8000
   MONGO_URL=your_mongodb_connection_string
   ```

3. **Install Dependencies:**
   * **Backend**:
     ```bash
     cd backend
     npm install
     ```
   * **Frontend**:
     ```bash
     cd ../frontend
     npm install
     ```

4. **Start Development Servers:**
   * **Backend**:
     ```bash
     cd backend
     npm run dev
     ```
   * **Frontend**:
     ```bash
     cd frontend
     npm run dev
     ```
   The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:8000`.

---

## ☁️ Deployment (Render)

This project is configured to run fully on **Render**.

### 1. Backend (Web Service)
* **Root Directory**: `backend`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Environment Variables**: Add `MONGO_URL` with your database connection string.

### 2. Frontend (Static Site)
* **Root Directory**: `frontend`
* **Build Command**: `npm run build`
* **Publish Directory**: `dist`
* **Environment Variables**: Add `VITE_BACKEND_URL` pointing to your deployed Render backend URL.
