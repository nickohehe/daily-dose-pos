# Daily Dose POS System

A high-performance, real-time Point of Sale (POS) system built for speed and reliability.

## 🚀 Features
-   **Real-Time Updates**: Instant syncing between Cashier and Kitchen (Socket.io).
-   **Local Network Support**: Works across multiple devices on the same WiFi.
-   **Offline-First Architecture**: Persistent PostgreSQL storage.
-   **Optimized Performance**: Lazy loading, Gzip compression, and database indexing.

## 🛠️ Prerequisites
Before simple setup, ensure you have:
1.  **Node.js** (v18 or higher)
2.  **PostgreSQL** (v14 or higher)

## 📦 Installation & Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd daily-dose
npm install
```

### 2. Configure Environment
Create a `.env` file based on the example:
```bash
cp .env.example .env
```
Edit `.env` and set your PostgreSQL password:
```ini
PGPASSWORD=your_actual_postgres_password
```

### 3. Initialize Database
Run the automated setup script to create the database and tables:
```bash
npm run db:setup
```

### 4. Build & Run
Build the frontend and start the production server:
```bash
npm run build
npm run start
```

## 📱 Accessing from Other Devices
1.  Find your computer's IP address (e.g., `192.168.1.5`).
2.  Update `.env` `VITE_API_URL` to `http://192.168.1.5:3000`.
3.  Rebuild: `npm run build`.
4.  Restart: `npm run start`.
5.  Open `http://192.168.1.5:3000` on your tablet or phone.

## 🧱 Project Structure
-   `src/`: React Frontend code.
-   `server.js`: Express/Socket.io Backend.
-   `scripts/`: Database management scripts.
-   `schema.sql`: Database structure.

## ⚡ Troubleshooting
-   **Database Error?** Check your `PGPASSWORD` in `.env`.
-   **Can't connect from phone?** Check your Windows Firewall and allow Node.js on port 3000.
