# 🪟 Windows Setup Guide (PowerShell)

> PowerShell does NOT support `&&` between commands. Use `;` instead, or run each command separately.

---

## Step 1 — Install root dependencies (fix the ethers conflict)

```powershell
# In the trustmart/ folder:
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag bypasses the peer dependency conflict.
> We've also fixed the package.json to use `hardhat-toolbox@^2.0.2` which works with ethers v5.

---

## Step 2 — Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

---

## Step 3 — Install agent dependencies

```powershell
cd agent
npm install
cd ..
```

---

## Step 4 — Set up environment files

```powershell
# Root .env
copy .env.example .env

# Frontend
copy frontend\.env.example frontend\.env.local

# Agent
copy agent\.env.example agent\.env
```

Now edit each `.env` file with your values (see below for where to get them).

---

## Step 5 — Compile contracts

```powershell
npx hardhat compile
```

---

## Step 6 — Deploy to Kite Chain

```powershell
npx hardhat run scripts/deploy.js --network kite_testnet
```

---

## Step 7 — Wire agent wallet

```powershell
npx hardhat run scripts/set-agent.js --network kite_testnet
```

---

## Step 8 — Seed demo products (optional)

```powershell
npx hardhat run scripts/seed.js --network kite_testnet
```

---

## Step 9 — Run the frontend (new PowerShell window)

```powershell
cd frontend
npm run dev
```

---

## Step 10 — Run the AI agent (another PowerShell window)

```powershell
cd agent
npm start
```

---

## 🔑 Where to Get Each .env Value

### `DEPLOYER_PRIVATE_KEY`
Your MetaMask wallet's private key — used to deploy contracts.

1. Open MetaMask extension
2. Click the **three dots** (⋮) on your account
3. Click **Account Details**
4. Click **Export Private Key**
5. Enter your MetaMask password
6. Copy the key and add `0x` prefix if missing

⚠️ **NEVER share this key or commit it to GitHub!**

---

### `AGENT_PRIVATE_KEY`
A **separate** wallet for the AI agent. Create a new one:

**Option A — MetaMask:**
1. Open MetaMask → Click your account icon (top right)
2. Click **Add account or hardware wallet**
3. Click **Add a new account** → Name it "TrustMart Agent"
4. Export its private key (same steps as above)
5. Copy the NEW account's wallet address
6. Fund it: send yourself 0.05 KITE from your main wallet

**Option B — Command line:**
```powershell
node -e "const {ethers}=require('ethers'); const w=ethers.Wallet.createRandom(); console.log('Address:',w.address); console.log('Key:',w.privateKey)"
```

---

### `FEE_RECEIVER_ADDRESS`
Your MetaMask wallet address (where platform fees go).
Leave empty to default to the deployer address.

To find it: Open MetaMask → Copy the address shown at the top (starts with 0x).

---

### `ANTHROPIC_API_KEY`
Get from [console.anthropic.com](https://console.anthropic.com):

1. Sign up / log in at console.anthropic.com
2. Click **API Keys** in the sidebar
3. Click **Create Key**
4. Copy the key (starts with `sk-ant-...`)

---

### `KITE_RPC_URL`
Pre-filled — do NOT change:
```
https://rpc-testnet.gokite.ai/
```

---

### `KITESCAN_API_KEY`
Optional. Leave empty if you don't need contract verification.

---

## 💧 Getting Testnet KITE

1. Go to the Kite Chain testnet faucet
2. Connect your MetaMask wallet
3. Request testnet KITE
4. Wait 1-2 minutes

You need at least **0.5 KITE** total:
- ~0.3 KITE for deploying 5 contracts
- ~0.1 KITE for listing fee testing
- ~0.05 KITE for the agent wallet

---

## 🐛 Common Errors

| Error | Fix |
|-------|-----|
| `ERESOLVE` npm conflict | Use `npm install --legacy-peer-deps` |
| `&&` not recognized | Use `;` in PowerShell or run commands separately |
| `Lock compromised` | Delete `package-lock.json`, run `npm install --legacy-peer-deps` |
| MetaMask `Failed to connect` | Refresh browser, unlock MetaMask, try again |
| `ABI not found` | Run `npx hardhat compile` then deploy |
| Agent wallet low balance | Send KITE to the agent address shown on startup |
| `AGENT_PRIVATE_KEY not set` | Add it to `agent/.env` |

---

## 🔄 Quick Reset (if something breaks)

```powershell
# Delete lock files and node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item frontend\package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force frontend\node_modules -ErrorAction SilentlyContinue

# Reinstall
npm install --legacy-peer-deps
cd frontend; npm install; cd ..
cd agent; npm install; cd ..
```
