# ICP Audit Ledger (TattleTent)

This folder contains the lightweight ICP canister used as an immutable verification layer.

## What is stored on-chain

Only governance proofs and lifecycle audit metadata are written to chain.

- `complaintId`
- `action`
- `actor`
- `oldValue` (optional)
- `newValue` (optional)
- `department` (optional)
- `timestamp`
- `metadataHash` (optional)

No full complaint payloads or PII-heavy records are persisted on-chain.

## Local setup (Linux / macOS / WSL)

The `dfx` CLI requires a Linux-like environment. On Windows, use **WSL (Windows Subsystem for Linux)**.

### Option 1: Using WSL (recommended for Windows)

1. Install WSL if not already installed:
   ```powershell
   wsl --install -d Ubuntu
   ```
2. Inside WSL, install the DFINITY SDK:
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```
3. Navigate to your project (WSL can access Windows filesystem at `/mnt/e/...`):
   ```bash
   cd /mnt/e/"Web Development Coding"/"Webster YdosS"/TattleTent/backend
   ```
4. Start the local replica and deploy:
   ```bash
   npm run icp:start
   npm run icp:deploy
   ```
5. Read the canister ID:
   ```bash
   cd icp && dfx canister id audit_ledger
   ```
6. Put that id into `backend/.env`:
   ```env
   ICP_ENABLED=true
   ICP_HOST=http://127.0.0.1:4943
   ICP_AUDIT_CANISTER_ID=<canister-id>
   ```
7. Start backend as usual:
   ```bash
   npm start
   ```

### Option 2: Using Docker (if WSL is unavailable)

If WSL is not an option, you can run dfx inside a Docker container:

```bash
docker run --rm -d --name dfx -p 4943:4943 -v ${PWD}:/workspace ghcr.io/dfinity/sdk:latest dfx start --host 0.0.0.0
```

Then interact with the container for `dfx deploy` commands.

## Stop local replica

- `npm run icp:stop`

## Production guidance

1. Deploy `audit_ledger` to ICP mainnet.
2. Set production backend env values:
   - `ICP_ENABLED=true`
   - `ICP_HOST=https://icp-api.io`
   - `ICP_AUDIT_CANISTER_ID=<production-canister-id>`
3. Keep retry values conservative (`ICP_RETRY_ATTEMPTS`, `ICP_RETRY_BACKOFF_MS`) to avoid noisy failures.
4. If ICP is unavailable, backend operational flows continue and logs capture sync failures.

## Candid interface

- `src/audit_ledger/audit_ledger.did`

Primary canister methods:

- `addAuditEvent`
- `getComplaintAuditTrail`
- `upsertVerificationRecord`
- `getVerificationRecord`

## Local replica URL

When running locally, the ICP replica is accessible at:
- `http://127.0.0.1:4943` (default)
- The canister ID for `audit_ledger` is output by `dfx canister id audit_ledger`

Set `ICP_HOST=http://127.0.0.1:4943` and `ICP_AUDIT_CANISTER_ID=<output-id>` in your `.env`.