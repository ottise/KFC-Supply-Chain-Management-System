# Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Cloudflare account (for tunnel)
- DockerHub account (for registry)

## Quick Start (Local)

### 1. Setup Environment

```bash
cd docker
cp .env.example .env
# Edit .env with your values
```

### 2. Build and Run

```bash
docker compose build --platform linux/amd64
docker compose up -d
```

## Deploy to DockerHub

### 1. Login DockerHub

```bash
docker login -u <your-username>
```

### 2. Build and Push

Build từ root project (nơi có Dockerfile):

```bash
docker buildx build --platform linux/amd64 -t <your-dockerhub-username>/kfc-frontend:latest --push .
```

## Run on Linux Server

### 1. Pull image

```bash
docker pull <your-dockerhub-username>/kfc-frontend:latest
```

### 2. Run with Docker Compose

Tạo file `docker-compose.yml`:

```yaml
services:
  frontend:
    image: <your-dockerhub-username>/kfc-frontend:latest
    platform: linux/amd64
    container_name: kfc-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://your-api.com/api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: kfc-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
```

```bash
CLOUDFLARE_TUNNEL_TOKEN=your-token docker compose up -d
```

### 3. Or Run Directly

```bash
docker run -d \
  --name kfc-frontend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://your-api.com/api \
  -e CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token \
  <your-dockerhub-username>/kfc-frontend:latest
```

## Cloudflare Tunnel Setup

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com)
2. Navigate to **Networks** → **Tunnels**
3. Create a new tunnel
4. Select **Cloudflared** as the connector
5. Copy the tunnel token

## Services

### Frontend
- **Image**: Custom Next.js
- **Port**: 3000
- **Health**: `/api/health`

### Cloudflared
- **Image**: `cloudflare/cloudflared:latest`
- **Purpose**: Tunnel to expose services via Cloudflare
- **Token**: Set via `CLOUDFLARE_TUNNEL_TOKEN`

## Common Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Rebuild after code changes
docker compose build --no-cache

# Shell into container
docker compose exec frontend sh
```
