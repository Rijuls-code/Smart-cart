# Hackthon GD

Monorepo with web admin + QR scanner (React/Vite) and Express API stubs for smart checkout.

## Getting started
1. Install deps (root uses npm workspaces):
   - `npm install --workspaces`
2. Start API:
   - `cd services/api && cp .env.example .env`
   - `npm run dev`
3. Start web admin:
   - `cd apps/web && npm run dev`

## API quick refs
- `POST /sessions { storeId }` → start session
- `POST /sessions/:id/scan { barcode, name, price, taxRate, qty }` → add item
- `POST /sessions/:id/pay` → mark paid (mock)
- `POST /sessions/:id/qr` → signed QR payload
- `POST /verify-qr { qrPayload }` → green/red
- `GET /products`, `POST /products` → manage catalog

## Notes
- In-memory data only. Replace with Firestore/Postgres + auth for production.
- QR signing uses HMAC placeholder; swap with RSA/ECDSA for real use.
- Web admin uses localhost:4000 API base; adjust for deployments.
