# Agent Guide

## Project

This is a work permit management prototype with an Express/SQLite backend and a Vite React frontend.

## Layout

- `server.js`: Express API server. Uses `PORT` or defaults to `3000`.
- `database.js`: SQLite setup and seed data.
- `client/`: React frontend powered by Vite.
- `client/vite.config.js`: Proxies `/api` requests to `http://localhost:3000`.

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

- `build_and_package.ps1` builds `client/dist`, obfuscates `server.js` and `database.js`, then writes `deploy.zip`.
- `deploy_to_remote.ps1` uploads `deploy.zip` and `setup_remote.sh` to `121.48.45.133` and runs the remote setup script.
- The remote process name is `work-permit-system`; useful checks are `pm2 status`, `pm2 restart work-permit-system`, and `pm2 logs work-permit-system`.
- Before any manual remote deployment, back up `/root/work-permit/work_permits.db` and restore it after unpacking if the zip includes a local database file. Do not overwrite customer data with a local test database.
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
