<#
AgriClip — Start All Services (Windows PowerShell)

This script launches three PowerShell terminals to run:
- FastAPI model service (Uvicorn) on port 8001
- Express backend API on port 8000 (or PORT env if set)
- Vite React frontend (port chosen automatically)

Usage:
- Right-click this file and select "Run with PowerShell"
- Or run from a PowerShell window:
    powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1

Prerequisites:
- Python 3.10+ installed and on PATH
- Node.js 18+ installed and on PATH
- Backend .env configured with MONGODB_URI and JWT_SECRET
- MODEL_SERVICE_URL will be set to http://localhost:8001 by this script
#>

param(
    [string]$ModelPort = "8001",
    [string]$BackendPort = "8000"
)

function Resolve-PathSafe {
    param([string]$p)
    return [System.IO.Path]::GetFullPath($p)
}

$root = Split-Path -Parent $PSCommandPath
$backend = Resolve-PathSafe (Join-Path $root 'crop-cure-chat-backend')
$service = Resolve-PathSafe (Join-Path $backend 'agriclip_service')
$frontend = Resolve-PathSafe (Join-Path $root 'crop-cure-chat-frontend\crop-cure-chat-frontend')

Write-Host "Starting AgriClip services..." -ForegroundColor Cyan
Write-Host "Backend:    $backend"
Write-Host "Model svc:  $service"
Write-Host "Frontend:   $frontend"

# --- Start FastAPI Model Service ---
$serviceCmd = @"
cd '$service';
if (-not (Test-Path '.venv')) { python -m venv .venv };
& .\.venv\Scripts\Activate.ps1;
pip install -r requirements.txt;
uvicorn main:app --host 0.0.0.0 --port $ModelPort --reload
"@
Start-Process PowerShell -ArgumentList @('-NoExit','-Command',$serviceCmd) | Out-Null
Write-Host "Model service starting on http://localhost:$ModelPort" -ForegroundColor Green

# --- Start Backend API ---
$backendCmd = @"
cd '$backend';
if (-not (Test-Path 'node_modules')) { npm install };
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' };
$env:MODEL_SERVICE_URL = 'http://localhost:$ModelPort';
$env:PORT = '$BackendPort';
npm run dev
"@
Start-Process PowerShell -ArgumentList @('-NoExit','-Command',$backendCmd) | Out-Null
Write-Host "Backend API starting on http://localhost:$BackendPort" -ForegroundColor Green

# --- Start Frontend (Vite) ---
$frontendCmd = @"
cd '$frontend';
if (-not (Test-Path 'node_modules')) { npm install };
npm run dev
"@
Start-Process PowerShell -ArgumentList @('-NoExit','-Command',$frontendCmd) | Out-Null
Write-Host "Frontend (Vite) starting — check terminal for the URL" -ForegroundColor Green

Write-Host "All services launching. Press Ctrl+C in each terminal to stop." -ForegroundColor Cyan