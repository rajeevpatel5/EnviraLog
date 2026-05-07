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
