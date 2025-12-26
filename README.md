# 🎧 Resonance — Music Streaming Web Application

Resonance is a **Spotify-like music streaming Web Application** built using the **MERN stack**, featuring **role-based access**, **artist uploads**, **admin moderation**, **secure audio storage**, and **public streaming with search & pagination**.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (User / Artist / Admin)
- Secure admin seeding (no public admin registration)

### 🎤 Artist Workflow
- Artists can create track metadata
- Secure audio uploads using Cloudinary
- Ownership validation for uploads
- Tracks require admin approval before public visibility

### 🛡️ Admin Moderation
- View pending tracks
- Listen to uploaded audio before approval
- Approve or reject tracks with controlled lifecycle
- Approved content becomes immutable

### 🎶 Public Streaming
- Public access to approved tracks only
- Audio streamed directly from Cloudinary
- No authentication required for playback

### 🔍 Search & Pagination
- Search by:
  - Track title
  - Genre
  - Artist username
- Case-insensitive partial matching
- Pagination support (`page`, `limit`)
- Sorted by newest uploads

### 🔐 Security Hardening
- Rate limiting for APIs and auth routes
- Input validation using express-validator
- File upload restrictions (type & size)
- Security headers via Helmet

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Media Storage**: Cloudinary
- **Security**: Helmet, express-rate-limit
- **Validation**: express-validator
- **File Uploads**: Multer

---

## 🔑 Roles & Access

| Role   | Permissions |
|-------|-------------|
| User  | Browse & stream approved tracks |
| Artist| Upload tracks & audio |
| Admin | Moderate and approve content |

---

## 🔐 Create a .env file inside backend/

- PORT=5000
- MONGO_URI=your_mongodb_uri

- JWT_SECRET=your_jwt_secret
- JWT_EXPIRES_IN=1h

- CLOUDINARY_CLOUD_NAME=xxxx
- CLOUDINARY_API_KEY=xxxx
- CLOUDINARY_API_SECRET=xxxx

- ADMIN_EMAIL=youradminemail
- ADMIN_PASSWORD=youradminpassword

---

## ▶️ Running the Backend

- cd backend
- npm install
- npm start

---

## 🧠 Design Decisions

- Audio is uploaded before approval but not publicly visible
- Admins preview audio via secure Cloudinary URLs
- Approved tracks are immutable
- Search is implemented using MongoDB regex for flexibility
- Pagination prevents excessive payloads

---

## 📌 Project Status

- ✅ Backend complete
- 🚧 Frontend work in progress

---