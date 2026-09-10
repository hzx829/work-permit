# Agent Guide

## Project

This is a work permit management prototype with an Express/SQLite backend and a Vite React frontend.

## Layout

- `server.js`: Express API server. Uses `PORT` or defaults to `3000`.
- `database.js`: SQLite setup and seed data.
- `client/`: React frontend powered by Vite.
- `client/vite.config.js`: Proxies `/api` requests to `VITE_API_TARGET`, or `http://localhost:3000` by default.

## Common Commands

Backend, from the repository root:

```powershell
npm install
npm start
```

Frontend, from `client/`:

```powershell
npm install
npm run dev
```

Typical local URLs:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Deployment

Production-style deployment for the current internal server is zip-based and PM2-managed:

```powershell
./build_and_package.ps1
./deploy_to_remote.ps1
```

Important deployment notes:

- `build_and_package.ps1` builds `client/dist`, obfuscates `server.js` and `database.js`, then writes `deploy.zip`. It intentionally skips local `work_permits.db` so customer data is not overwritten.
- `deploy_to_remote.ps1` uploads `deploy.zip` and `setup_remote.sh` to `121.48.45.133` and runs the remote setup script.
- The remote process name is `work-permit-system`; useful checks are `pm2 status`, `pm2 restart work-permit-system`, and `pm2 logs work-permit-system`.
- Before any manual remote deployment, back up `/root/work-permit/work_permits.db`. Do not add a local test database to the deploy package.
- Default test accounts are `worker` and `safety`; both currently use `Schy123456#`.
- If SSH/SCP times out, check that EasyConnect L3VPN/virtual network is active and that local system proxy is not preventing the Sangfor virtual adapter from connecting.

## Local Node On This Machine

Node.js is installed at `C:\Program Files\nodejs\`.

Use explicit paths if `node` or `npm` are not available in the shell:

```powershell
& 'C:\Program Files\nodejs\node.exe' -v
& 'C:\Program Files\nodejs\npm.cmd' -v
```

## Development Notes

- Keep backend API changes compatible with the React client unless both sides are updated together.
- Prefer the existing Express route style in `server.js` and the existing React patterns under `client/src`.
- Do not commit generated dependency folders such as `node_modules/`.
- If port `5173` is busy, Vite may choose the next available port.
- The cockpit weather panel is connected to the server-side Open-Meteo relay for Luzhou and refreshes every 10 minutes. For commercial production use, configure `WEATHER_API_KEY` for the customer endpoint or point `WEATHER_API_BASE` at an appropriately licensed/self-hosted service; optional location overrides are `WEATHER_LOCATION`, `WEATHER_LATITUDE`, and `WEATHER_LONGITUDE`. Emergency camera and drone video panels remain presentation-stage placeholders and must not be represented as connected feeds until those services are integrated.
- Emergency response is now a persisted workflow shared by the cockpit and emergency-management page. `emergency_events`, `emergency_gas_readings`, `emergency_attachments`, and `emergency_simulation_state` are initialized in `database.js`; the authenticated routes are implemented in `server.js` under `/api/emergency-*`.
- A cockpit alarm is generated only when an abnormal watch status/vital sign and a fresh gas-limit exceedance occur together. Gas readings older than two minutes must not trigger a new alarm.
- Emergency event progress, AI-guided messages, response level, rescue mode, recovery checklist, timeline, emergency-release file, and review report are persisted. Preserve resume/history behavior when changing the emergency UI.
- Available emergency plans are event data rather than a fixed three-plan assumption. The comprehensive plan is always the fallback; onsite and special plans should appear only when supplied for that event or enterprise.
- The AI-guided emergency interaction intentionally waits about 850-1200 ms after the operator responds, displays a generating state, and then shows and speaks the fixed workflow response. Keep controls disabled during that delay to prevent duplicate transitions.
- The temporary accident simulator is available automatically outside production. In production it must remain disabled unless `ENABLE_EMERGENCY_SIMULATION=true` is explicitly set in the persistent server/PM2 environment. Simulated alarms and readings must always be visibly labeled as test data, and switching simulation off must not delete already-created emergency records.
- Keep “应急处置管理” as the first item under the “安全管理体系” sidebar group while this module is the current operational priority.
- The cockpit globe uses the MIT-licensed `react-globe.gl` package with local official Blue Marble assets. Its geographic labels are limited to 中国 → 四川省 → 泸州市, default to Luzhou with a red marker, and stop zooming at city level. Sichuan prefecture boundaries come from the local `client/public/sichuan-prefectures.geojson`; keep the default view free of city outlines and convert only the hovered/tapped city's rings into the path layer (never polygon fills) to avoid multi-polygon stalls and spherical winding artifacts. Keep city label objects stable, use click/tap as the touch fallback, and keep dashboard indicators outside the globe canvas unless the customer explicitly asks for map overlays.
- The confined-space permit flow is: 票证申请 → 气体浓度检测 and 现场安全措施确认 → 票证审批 → 安全交底 → 核验票证 → 完成作业. Keep client-facing checks aligned with this order.
