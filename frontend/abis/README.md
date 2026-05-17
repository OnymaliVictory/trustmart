# ABI Files

This directory contains the compiled contract ABIs.

They are **automatically generated** when you run:

```bash
# From project root:
npx hardhat compile
npx hardhat run scripts/deploy.js --network kite_testnet
```

The deploy script copies:
- `ProductRegistry.json`
- `EscrowOrder.json`  
- `DisputeResolver.json`
- `ReputationSystem.json`

Each file contains: `{ "abi": [...] }`
