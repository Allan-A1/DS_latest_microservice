# 🎵 Spotify Clone - MERN Stack

A full-stack Spotify clone built using the MERN (MongoDB, Express.js, React.js, Node.js) stack with user and admin functionalities.

## ✨ Features

### User Features
- 🎧 Stream music with play, pause, skip, and volume controls
- 📱 Responsive design for all devices

### Admin Features
- 🎵 Add and manage songs
- 💿 Create and manage albums

## 🚀 Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (replica set, majority write concern)
- **Cache / queue:** Redis (list cache + play-event stream)
- **Gateway:** Nginx (round-robin over two API replicas)
- **File Storage:** Cloudinary

Distributed-systems explanation and reviewer demo: [REVIEWER_GUIDE.md](REVIEWER_GUIDE.md) (short command sheet: [DS_DEMO.md](DS_DEMO.md)).

## 📦 Installation

1. Clone the repository
```bash
bash
git clone https://github.com/your-username/spotify-clone.git
cd spotify-clone
```

2. Install dependencies for backend
```bash
cd backend
npm install
```

3. Install dependencies for frontend
```bash
cd ../frontend
npm install
```

4. Configure environment variables
- Create `.env` files in both frontend and backend directories
- Add necessary environment variables:
```env
# Backend .env
PORT=
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MONGODB_URI=
REDIS_URL=redis://localhost:6379
INSTANCE_ID=local
```

5. Start the distributed backend (from the `Spotify-Clone` folder). Stop anything already using port 3000.

```bash
docker compose up --build
```

6. Start the UIs

```bash
# Frontend
cd Frontend
npm run dev

# Admin (another terminal)
cd admin
npm run dev
```

Single-process backend without Docker: `cd Backend && npm run start` (and `npm run worker` if Redis is local). Full demo script: [DS_DEMO.md](DS_DEMO.md).

## 🔧 Configuration

### Backend Configuration
- Configure MongoDB connection
- Set up JWT authentication
- Configure storage solution for music files

### Admin Setup
1. Access the admin panel at `/admin`
2. Use admin credentials to log in
3. Start managing content through the dashboard

## 💻 Usage

### For Users
1. Browse available songs and albums
2. Create playlists and add favorite songs
3. Use the music player controls to enjoy music

### For Admins
1. Access admin dashboard
2. Add new songs and albums
3. Manage user accounts
4. Monitor platform analytics

## 📝 API Documentation

The API endpoints are organized into the following categories:

- Songs: `/api/song/add`, `/api/song/list`, `/api/song/remove`,
- Albums: `/api/album/add`, `/api/album/list`, `/api/album/remove`

Detailed API documentation can be found in the backend directory.

## 👨‍💻 Author

Your Name
- GitHub: [@adityakkpk](https://github.com/adityakkpk)
- LinkedIn: [Aditya Kumar Kushwaha](https://linkedin.com/in/akkpk)