# Passport contracts

## Overview

This repository contains smart contracts used for passport-style credential verification within the Privado ID (Billions) ecosystem.

### What these contracts enable
- On-chain verification of passport credentials
- Zero-knowledge proof-based validation without exposing user data
- Reusable verification logic for applications integrating Billions

## Building contracts

1. Install dependencies:
```bash
npm i
```
2. Compile contracts:
```bash
npm run compile
```

## Testing
1. Download test circuits
```shell
./dl_circuits.sh
```

Run the different tests: 
```shell
npm test
```

