# CloudSim — Intelligent Cloud Resource Allocation & QoS Optimizer

A web-based cloud computing simulator implementing the **Hungarian Algorithm-Based Binding Policy (HABBP)** for optimal task-to-VM allocation.

**Stack:** Python Flask · React 18 (CDN) · Tailwind CSS (CDN) · Chart.js · SQLite

---

## Deploy to Render (GitHub → Render)

1. **Push this repo to GitHub**
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Deploy**
5. Visit your live URL — login with `admin / admin123`

> **Note on SQLite persistence:** Render free tier has an ephemeral filesystem.  
> Data resets on each deploy/restart. To persist data, add a **Render Disk**  
> (paid), mount it at `/data`, and set `DATABASE_URL=/data/cloud.db` in env vars.

---

## Run Locally

```bash
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```

---

## Project Structure

```
├── app.py              # Flask backend — all API routes + Hungarian Algorithm
├── requirements.txt    # Python dependencies (pinned)
├── render.yaml         # Render.com deploy config
├── .gitignore
├── README.md
└── static/
    ├── index.html      # HTML shell — loads React/Tailwind/Chart.js from CDN
    └── app.jsx         # Full React SPA — all pages and components
```

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Live donut gauges, trend charts, task progress, recent allocations |
| **Physical Machines** | Full CRUD for hardware infrastructure |
| **Virtual Machines** | Full CRUD + bulk reset to idle |
| **Tasks & HABBP** | Create tasks, run Hungarian Algorithm allocation with cost matrix |
| **QoS Analytics** | Full metric history, latency/throughput trends, allocation log |

**Default credentials:** `admin` / `admin123`
