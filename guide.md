# Deployment Guide

This guide will walk you through deploying your "Daily Dose" POS system to the cloud using the separate `client` and `server` structure.

## Prerequisites
1.  A GitHub account (Repo must be pushed to GitHub).
2.  A [Railway](https://railway.app/) account (for Backend + Database).
3.  A [Vercel](https://vercel.com/) account (for Frontend).

---

## Part 1: Push Code to GitHub
1.  Initialize git if you haven't: `git init`
2.  Commit all changes:
    ```bash
    git add .
    git commit -m "Refactor: Separate client and server"
    ```
3.  Push to your GitHub repository.

---

## Part 2: Backend (Railway)
**Goal:** specific a Node.js server and a PostgreSQL database.

1.  **New Project**: Go to Railway Dashboard -> "New Project" -> "Deploy from GitHub repo".
2.  **Select Repo**: Choose your `daily-dose-cloud` repository.
3.  **Configure Service**:
    *   Click on the new card created for your repo.
    *   Go to **Settings** -> **General**.
    *   Find **Root Directory** and set it to: `/server`
    *   (Railway might auto-detect this, but it's good to be sure).
4.  **Add Database**:
    *   Right-click the empty canvas background -> "New" -> "Database" -> "PostgreSQL".
    *   Railway will automatically link variables (like `DATABASE_URL`) to your server service.
5.  **Domain**:
    *   In your Server Service -> **Settings** -> **Networking**.
    *   Click "Generate Domain" (e.g., `daily-dose-production.up.railway.app`).
    *   **Copy this URL** (You need it for Part 3).

---

## Part 3: Frontend (Vercel)
**Goal:** particular a static React site.

1.  **New Project**: Go to Vercel Dashboard -> "Add New..." -> "Project".
2.  **Select Repo**: Import `daily-dose-cloud`.
3.  **Configure Project**:
    *   **Framework Preset**: Vite (should auto-detect).
    *   **Root Directory**: Click "Edit" and select `client`.
4.  **Environment Variables**:
    *   Add a new variable:
        *   **Name**: `VITE_API_URL`
        *   **Value**: `https://<YOUR-RAILWAY-URL>` (Paste the URL from Part 2, Step 5).
        *   *Important:* Make sure it starts with `https://` and has NO trailing slash `/`.
5.  **Deploy**: Click "Deploy".

---

## Part 4: Final Database Setup
Your cloud database is currently empty. You need to create the tables.

**Option A: Automated (If you added the build script)**
If your `package.json` in `/server` has a `build` or `prestart` script that runs `db:setup`, it might run automatically.

**Option B: Manual (Easiest)**
1.  Install the **Railway CLI** locally or use their web interface "Query" tab.
2.  Copy the contents of `server/schema.sql`.
3.  In Railway Dashboard -> Click PostgreSQL -> "Data" tab -> "Execute SQL".
4.  Paste the schema and run it.

**Option C: Connect Local PC to Cloud DB**
1.  Get the "Public Networking" URL from Railway Database settings.
2.  Update your local `.env` with that URL.
3.  Run `npm run db:setup` inside the `server` folder on your computer.

---

## Verification
1.  Open your Vercel URL (e.g., `daily-dose.vercel.app`).
2.  Try to create an order.
3.  Check if it appears in your Railway Server logs.
