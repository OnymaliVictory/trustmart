@echo off
echo.
echo  ================================================
echo    TrustMart - Windows Auto Setup
echo  ================================================
echo.

echo [1/5] Installing root dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
  echo ERROR: npm install failed. Try: npm install --force
  pause
  exit /b 1
)

echo.
echo [2/5] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (echo WARNING: Some frontend packages may have issues)
cd ..

echo.
echo [3/5] Installing agent dependencies...
cd agent
call npm install
if errorlevel 1 (echo WARNING: Agent install had issues)
cd ..

echo.
echo [4/5] Copying .env files...
if not exist .env copy .env.example .env
if not exist frontend\.env.local copy frontend\.env.example frontend\.env.local
if not exist agent\.env copy agent\.env.example agent\.env

echo.
echo [5/5] Done!
echo.
echo ================================================
echo  NEXT STEPS:
echo ================================================
echo  1. Edit .env          - add DEPLOYER_PRIVATE_KEY
echo  2. Edit agent\.env    - add ANTHROPIC_API_KEY + AGENT_PRIVATE_KEY
echo  3. Run: npx hardhat compile
echo  4. Run: npx hardhat run scripts/deploy.js --network kite_testnet
echo  5. Run: npx hardhat run scripts/set-agent.js --network kite_testnet
echo  6. Open NEW window: cd frontend ^& npm run dev
echo  7. Open NEW window: cd agent ^& npm start
echo.
echo  See WINDOWS_SETUP.md for detailed instructions
echo ================================================
pause
