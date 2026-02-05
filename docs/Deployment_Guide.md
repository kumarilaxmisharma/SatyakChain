# Deployment Guide

## CertiChain Platform

**Version:** 1.0 | **Last Updated:** January 2026

---

## 1. Prerequisites

- Node.js 20.x LTS
- pnpm 8.x
- Docker & Docker Compose
- MetaMask wallet with Sepolia ETH
- Alchemy account (RPC provider)

---

## 2. Local Development

### Start Infrastructure
```bash
docker-compose up -d
```

### Deploy Contracts
```bash
cd contracts
cp .env.example .env
# Edit .env with your keys
npx hardhat run scripts/deploy.ts --network sepolia
```

### Start Backend
```bash
cd backend
cp .env.example .env
# Edit .env with DATABASE_URL and CONTRACT_ADDRESS
pnpm install
pnpm db:push
pnpm dev
```

### Start Frontend
```bash
cd frontend
cp .env.example .env.local
# Edit with NEXT_PUBLIC_* variables
pnpm install
pnpm dev
```

---

## 3. Environment Variables

### Contracts (.env)
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your-deployer-private-key
ETHERSCAN_API_KEY=your-etherscan-key
```

### Backend (.env)
```env
DATABASE_URL=postgresql://certichain:certichain@localhost:5432/certichain
JWT_SECRET=your-super-secret-key-min-32-chars
CONTRACT_ADDRESS=0x...deployed-contract
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...deployed-contract
NEXT_PUBLIC_CHAIN_ID=11155111
```

---

## 4. Production Deployment

### Smart Contracts (Mainnet)
```bash
npx hardhat run scripts/deploy.ts --network mainnet
npx hardhat verify --network mainnet DEPLOYED_ADDRESS
```

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with `pnpm build && pnpm start`

### Frontend (Vercel)
1. Import project from GitHub
2. Set environment variables
3. Deploy automatically

### Database (Supabase/Railway)
1. Create PostgreSQL instance
2. Update DATABASE_URL
3. Run `pnpm db:push`

---

## 5. Verification Checklist

- [ ] Smart contract deployed and verified
- [ ] Backend API responding
- [ ] Frontend loading correctly
- [ ] Database connected
- [ ] MetaMask connecting
- [ ] Document issuance working
- [ ] Verification working

---

## 6. Monitoring

| Service | Tool |
|---------|------|
| Frontend | Vercel Analytics |
| Backend | Railway Logs |
| Database | Supabase Dashboard |
| Blockchain | Etherscan |
