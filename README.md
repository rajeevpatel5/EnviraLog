# EnviraLog

> **An IoT-based environmental monitoring system.**
> Collects sensor data, visualises it in real time, manages devices, and forecasts future conditions using machine learning.

**Authors:** Rajeev Patel · Manis Khatri

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Repository Layout](#3-repository-layout)
4. [Backend](#4-backend)
5. [Frontend](#5-frontend)
6. [Forecaster](#6-forecaster)
7. [How to Run the Full System](#7-how-to-run-the-full-system)
8. [Common Problems](#8-common-problems)
9. [Notes](#9-notes)
10. [Authors](#10-authors)

---

## 1. Introduction

EnviraLog helps you:

- Collect sensor data (temperature, humidity, air quality)
- Monitor data in real time
- Manage IoT devices
- Generate alerts and reports
- Predict future environmental data using machine learning

The system is divided into **three main parts**:

| # | Component   | Folder                  | Stack                             |
|---|-------------|-------------------------|-----------------------------------|
| 1 | Backend     | `backend/`              | Node.js · Express · Prisma · MQTT |
| 2 | Frontend    | `frontend/`             | React · Vite · Tailwind CSS       |
| 3 | Forecaster  | `weather_forecaster/`   | Python · XGBoost · scikit-learn   |

---

## 2. System Architecture

```
        ┌──────────┐
        │ Devices  │
        └────┬─────┘
             │  MQTT / HTTP
             ▼
       ┌───────────┐        ┌────────────┐
       │  Backend  │ ─────▶ │  Database  │
       │    API    │        └────────────┘
       └─────┬─────┘
             │
             ▼
       ┌───────────┐        ┌──────────────┐
       │ Frontend  │ ◀──── │  Forecaster  │
       │    UI     │        │     (ML)     │
       └───────────┘        └──────────────┘
```

- **Devices** send data over MQTT or HTTP.
- **Backend** stores and processes data.
- **Frontend** displays data in real time.
- **Forecaster** predicts future values from historical data.

---

## 3. Repository Layout

| Path                    | Description                                                   |
|-------------------------|---------------------------------------------------------------|
| `frontend/`             | React (Vite) dashboard                                        |
| `backend/`              | Express API, Prisma, MQTT subscriber                          |
| `weather_forecaster/`   | Python forecast service and scheduler                         |
| `IoT_sensors/`          | Sensor wiring notes and reference material                    |
| `docs/`                 | Proposals, reports, and [Pico sensor setup](docs/sensor_setup_pico.md) |
| `Sensors_TestFile.ino`  | Arduino test sketch                                           |

Secrets (`.env`) and `node_modules/` are not tracked. Regenerate the Prisma client after cloning: `cd backend && npm run prisma:generate`.

---

## 4. Backend

### Purpose
Handles all core logic and data processing.

### Main Responsibilities
- User authentication (JWT)
- Device management
- Sensor data storage
- Alerts and reports
- MQTT communication
- Forecast integration

### Tech Stack
- Node.js
- Express
- TypeScript
- PostgreSQL (via Prisma)
- MQTT
- WebSocket

### Important APIs

**Auth**

| Method | Endpoint              |
|--------|-----------------------|
| POST   | `/api/auth/login`     |
| POST   | `/api/auth/register`  |

**Devices**

| Method | Endpoint            |
|--------|---------------------|
| GET    | `/api/devices`      |
| POST   | `/api/devices`      |
| PUT    | `/api/devices/:id`  |

**Data**

| Method | Endpoint     |
|--------|--------------|
| POST   | `/api/data`  |
| GET    | `/api/data`  |

**Alerts**

| Method | Endpoint       |
|--------|----------------|
| POST   | `/api/alerts`  |
| GET    | `/api/alerts`  |

**Forecast**

| Method | Endpoint         |
|--------|------------------|
| GET    | `/api/forecast`  |

### Setup

```bash
cd backend
cp .env.example .env          # fill in your secrets
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

**Backend URL:** http://localhost:3001

Example `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/enviralog
JWT_SECRET=your_secret_key
MQTT_BROKER_URL=mqtt://localhost:1883
PORT=3001
```

---

## 5. Frontend

### Purpose
User interface to interact with the system.

### Features
- Dashboard (real-time data)
- Charts and graphs
- Device management
- Alerts and reports
- Forecast visualisation
- Authentication system

### Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS

### Main Pages
- Login
- Dashboard
- Devices
- Alerts
- Reports
- Forecaster
- Admin

### Setup

```bash
cd frontend
npm install
npm run dev
```

**Frontend URL:** http://localhost:5173

---

## 6. Forecaster

### Purpose
Predict future environmental data.

### What it does
- Uses historical data
- Trains an ML model (XGBoost)
- Predicts the next 40 time steps
- Saves output as JSON

### Tech Stack
- Python
- XGBoost
- Pandas
- scikit-learn

### Setup

```bash
cd weather_forecaster
pip install -r requirements.txt
```

Add the data file at `data/data.csv` with the following columns:

| Column        |
|---------------|
| `Timestamp`   |
| `Device`      |
| `Temperature` |
| `Humidity`    |
| `Air Quality` |

Train the model:

```bash
python -c "from node1_forecaster import retrain; retrain()"
```

Run the scheduler:

```bash
python scheduler.py
```

---

## 7. How to Run the Full System

| Step | Action                                |
|------|---------------------------------------|
| 1    | Start the **Backend**                 |
| 2    | Start the **Frontend**                |
| 3    | *(Optional)* Start the **Forecaster** |

Then:

1. Open the frontend in your browser.
2. Login or register.
3. Add devices.
4. Send data.
5. View the dashboard.

---

## 8. Common Problems

| Issue                  | Fix                                                              |
|------------------------|------------------------------------------------------------------|
| Backend not starting   | Check `.env` file and that the database is running               |
| Frontend not working   | Run `npm install`                                                |
| Forecaster errors      | Make sure `data.csv` exists and Python dependencies are installed |
| Database error         | Create the database manually                                     |

---

## 9. Notes

- The **forecaster is optional** — the rest of the system works without it.
- **MQTT is optional** — the backend also accepts data over HTTP.
- Make sure the required ports (`3001`, `5173`) are free.
- Use proper credentials in `.env` — do **not** commit secrets.

---

## 10. Authors

This project is attributed to:

- **Rajeev Patel**
- **Manis Khatri**
