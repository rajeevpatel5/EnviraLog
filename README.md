# EnviraLog

Environmental logging and monitoring: IoT sensor data, dashboard, forecasts, and course documentation.

## Repository layout

| Path | Description |
|------|-------------|
| `frontend/` | React (Vite) dashboard — `npm install && npm run dev` |
| `backend/` | Express API, Prisma, MQTT — copy `.env.example` to `.env`, then `npm install` and `npm run dev` |
| `weather_forecaster/` | Python forecast service and scheduler — see `weather_forecaster/README.md` |
| `IoT_sensors/` | Sensor notes |
| `docs/` | Proposals, reports, and [Pico sensor setup](docs/sensor_setup_pico.md) |
| `Sensors_TestFile.ino` | Arduino test sketch |

Secrets (`.env`) and `node_modules` are not tracked. Regenerate Prisma client after clone: `cd backend && npm run prisma:generate`.

ENVIRALOG IoT PROJECT
Simple but Detailed Setup & Overview Guide

====================================================================
1. INTRODUCTION
====================================================================

EnviroLog is an IoT-based environmental monitoring system.

It helps you:
- Collect sensor data (temperature, humidity, air quality)
- Monitor data in real-time
- Manage IoT devices
- Generate alerts and reports
- Predict future environmental data using machine learning

The system is divided into 3 main parts:
1. Backend (API server)
2. Frontend (Dashboard UI)
3. Forecaster (Machine Learning service)


====================================================================
2. SYSTEM ARCHITECTURE (SIMPLE)
====================================================================

Devices → Backend API → Database
                   ↓
                Frontend UI
                   ↓
              Forecaster (ML)

- Devices send data using MQTT/HTTP
- Backend stores and processes data
- Frontend displays data
- Forecaster predicts future values


====================================================================
3. BACKEND (iot-backend)
====================================================================

Purpose:
Handles all core logic and data processing.

Main Responsibilities:
- User authentication (JWT)
- Device management
- Sensor data storage
- Alerts and reports
- MQTT communication
- Forecast integration

Tech Stack:
- Node.js
- Express
- TypeScript
- PostgreSQL (via Prisma)
- MQTT
- WebSocket

Important APIs:

Auth:
POST   /api/auth/login
POST   /api/auth/register

Devices:
GET    /api/devices
POST   /api/devices
PUT    /api/devices/:id

Data:
POST   /api/data
GET    /api/data

Alerts:
POST   /api/alerts
GET    /api/alerts

Forecast:
GET    /api/forecast


--------------------------------------------------------------------
Backend Setup
--------------------------------------------------------------------

cd iot-backend
npm install

Create .env file:

DATABASE_URL=postgresql://user:password@localhost:5432/enviralog
JWT_SECRET=your_secret_key
MQTT_BROKER_URL=mqtt://localhost:1883
PORT=3001

Run:

npm run prisma:generate
npm run prisma:migrate
npm run dev

Backend URL:
http://localhost:3001


====================================================================
4. FRONTEND (Iot-frontend)
====================================================================

Purpose:
User interface to interact with the system.

Features:
- Dashboard (real-time data)
- Charts and graphs
- Device management
- Alerts and reports
- Forecast visualization
- Authentication system

Tech Stack:
- React
- TypeScript
- Vite
- Tailwind CSS

Main Pages:
- Login
- Dashboard
- Devices
- Alerts
- Reports
- Forecaster
- Admin

--------------------------------------------------------------------
Frontend Setup
--------------------------------------------------------------------

cd iot-frontend
npm install
npm run dev

Frontend URL:
http://localhost:5173


====================================================================
5. FORECASTER (weather_forecaster)
====================================================================

Purpose:
Predict future environmental data.

What it does:
- Uses historical data
- Trains ML model (XGBoost)
- Predicts next 40 time steps
- Saves output as JSON

Tech Stack:
- Python
- XGBoost
- Pandas
- Scikit-learn

--------------------------------------------------------------------
Forecaster Setup
--------------------------------------------------------------------

cd weather_forecaster
pip install -r requirements.txt

Add data file:
data/data.csv

Required columns:
- Timestamp
- Device
- Temperature
- Humidity
- Air Quality

Run training:

python -c "from node1_forecaster import retrain; retrain()"

Run scheduler:

python scheduler.py


====================================================================
6. PROJECT STRUCTURE
====================================================================

enviralog/
│
├── iot-backend/
├── Iot-frontend/
└── weather_forecaster/


====================================================================
7. HOW TO RUN FULL SYSTEM
====================================================================

Step 1: Start Backend
Step 2: Start Frontend
Step 3: (Optional) Start Forecaster

Then:
- Open frontend
- Login/Register
- Add devices
- Send data
- View dashboard


====================================================================
8. COMMON PROBLEMS
====================================================================

Backend not starting:
- Check .env file
- Check database running

Frontend not working:
- Run npm install

Forecaster errors:
- Check data.csv exists
- Install Python dependencies

Database error:
- Create database manually


====================================================================
9. NOTES
====================================================================

- Forecaster is optional
- MQTT is optional (can use HTTP only)
- Make sure ports are free
- Use proper credentials in .env

====================================================================
END OF DOCUMENT
====================================================================
