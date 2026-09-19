# Docker - Interview Ready Guide

**1. Fundamentals** - What It Is, Containers vs VMs, Core Concepts

**2. Basic Commands** - run, build, ps, exec, logs, stop, rm

**3. Dockerfiles** - FROM, COPY, RUN, CMD, Multi-Stage Builds

**4. Docker Compose** - Services, Networks, Volumes, Environment

**5. Development Workflow** - Hot Reload, Debugging

**6. Networking** - Bridge, Host, Container Communication

**7. Data Persistence** - Volumes, Bind Mounts

**8. Production** - Security, Optimization, Health Checks

**9. Patterns** - Common Docker Patterns

**10. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Docker is a platform for developing, shipping, and running applications in containers. A container is a lightweight, standalone, executable package that includes everything needed to run an application: code, runtime, system tools, libraries, and settings.

Think of containers as ultra-lightweight virtual machines, but with a crucial difference. Virtual machines virtualize hardware and run complete operating systems. Containers virtualize the operating system and share the host's kernel, making them much smaller and faster.

```
Virtual Machines:
┌─────────┐ ┌─────────┐ ┌─────────┐
│  App A  │ │  App B  │ │  App C  │
├─────────┤ ├─────────┤ ├─────────┤
│Guest OS │ │Guest OS │ │Guest OS │
├─────────┤ ├─────────┤ ├─────────┤
│ Hypervisor                      │
├─────────────────────────────────┤
│         Host OS                 │
├─────────────────────────────────┤
│         Hardware                │
└─────────────────────────────────┘

Containers:
┌─────────┐ ┌─────────┐ ┌─────────┐
│  App A  │ │  App B  │ │  App C  │
├─────────┤ ├─────────┤ ├─────────┤
│Container│ │Container│ │Container│
├─────────────────────────────────┤
│       Docker Engine             │
├─────────────────────────────────┤
│         Host OS                 │
├─────────────────────────────────┤
│         Hardware                │
└─────────────────────────────────┘
```

Docker solves the "works on my machine" problem. By packaging an application with its dependencies, Docker ensures it runs the same everywhere—developer's laptop, test server, production cloud.

---

## Core Concepts

### Images

An image is a read-only template for creating containers. It contains:
- Base operating system (Alpine, Ubuntu, etc.)
- Application code
- Dependencies and libraries
- Environment variables
- Configuration files
- Commands to run

Images are built in layers. Each instruction in a Dockerfile creates a layer. Layers are cached and reused, making builds faster.

```
┌────────────────────────┐
│ Run npm start          │  Layer 5 (CMD)
├────────────────────────┤
│ Copy application code  │  Layer 4
├────────────────────────┤
│ npm install            │  Layer 3
├────────────────────────┤
│ Install Node.js        │  Layer 2
├────────────────────────┤
│ Alpine Linux           │  Layer 1 (Base)
└────────────────────────┘
```

### Containers

A container is a running instance of an image. You can:
- Start, stop, restart containers
- Run multiple containers from the same image
- Connect containers to networks
- Attach storage volumes
- View logs and execute commands

Containers are ephemeral by default—when they stop, any changes inside are lost (unless you use volumes).

### Dockerfile

A text file containing instructions to build an image:

```dockerfile
# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]
```

### Docker Compose

A tool for defining and running multi-container applications:

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/myapp
    depends_on:
      - db
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret

volumes:
  postgres_data:
```

---

## Basic Commands

### Working with Images

```bash
# Pull image from Docker Hub
docker pull node:20-alpine

# List local images
docker images

# Build image from Dockerfile
docker build -t myapp:latest .

# Build with different Dockerfile
docker build -f Dockerfile.prod -t myapp:prod .

# Tag an image
docker tag myapp:latest myapp:v1.0.0

# Remove image
docker rmi myapp:latest

# Remove all unused images
docker image prune

# Push to registry
docker push username/myapp:latest
```

### Working with Containers

```bash
# Run container (creates and starts)
docker run node:20-alpine

# Run with options
docker run -d \                      # Detached (background)
  --name myapp \                     # Container name
  -p 3000:3000 \                     # Port mapping (host:container)
  -e NODE_ENV=production \           # Environment variable
  -v $(pwd):/app \                   # Volume mount
  --rm \                             # Remove when stopped
  myapp:latest

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop myapp

# Start stopped container
docker start myapp

# Restart container
docker restart myapp

# Remove container
docker rm myapp

# Remove all stopped containers
docker container prune

# View logs
docker logs myapp
docker logs -f myapp            # Follow (live)
docker logs --tail 100 myapp    # Last 100 lines

# Execute command in running container
docker exec -it myapp sh        # Interactive shell
docker exec myapp ls /app       # Run command

# Copy files to/from container
docker cp myapp:/app/file.txt .
docker cp file.txt myapp:/app/

# View container details
docker inspect myapp

# View resource usage
docker stats
```

### Docker Compose Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Build and start
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs
docker-compose logs -f web

# Run command in service
docker-compose exec web sh

# Scale service
docker-compose up -d --scale worker=3

# List services
docker-compose ps
```

---

## Writing Dockerfiles

### Basic Node.js Application

```dockerfile
# Use specific version for reproducibility
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose port (documentation)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start command
CMD ["node", "server.js"]
```

### Multi-Stage Build

Separate build and runtime environments for smaller images:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Python Application

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

### Dockerfile Best Practices

```dockerfile
# 1. Use specific base image versions
FROM node:20.10.0-alpine3.18  # Not just "node" or "node:latest"

# 2. Minimize layers - combine RUN commands
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl \
      git && \
    rm -rf /var/lib/apt/lists/*

# 3. Order commands by change frequency
# (Least frequently changed first for better caching)
COPY package*.json ./        # Changes less often
RUN npm ci
COPY . .                     # Changes more often

# 4. Use .dockerignore
# Create .dockerignore file:
# node_modules
# .git
# *.log
# .env

# 5. Don't run as root
USER node

# 6. Use COPY instead of ADD (unless you need URL/tar extraction)
COPY ./src ./src

# 7. Set explicit working directory
WORKDIR /app

# 8. Use environment variables for configuration
ENV NODE_ENV=production
```

---

## Docker Compose Deep Dive

### Complete Example

```yaml
version: '3.8'

services:
  # Node.js application
  api:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: myapp-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:secret@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./logs:/app/logs
    networks:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL database
  db:
    image: postgres:15-alpine
    container_name: myapp-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis cache
  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - backend

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: myapp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api
    networks:
      - backend

networks:
  backend:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

```yaml
services:
  api:
    # Inline
    environment:
      - NODE_ENV=production
      - API_KEY=secret
    
    # From file
    env_file:
      - .env
      - .env.production
```

### Volume Types

```yaml
services:
  app:
    volumes:
      # Named volume (managed by Docker)
      - data:/app/data
      
      # Bind mount (host path)
      - ./src:/app/src
      
      # Read-only bind mount
      - ./config:/app/config:ro
      
      # Anonymous volume
      - /app/node_modules

volumes:
  data:
```

### Networking

```yaml
services:
  api:
    networks:
      - frontend
      - backend
  
  db:
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

---

## Development Workflow

### Development Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  api:
    build:
      context: .
      target: development
    volumes:
      # Mount source code for hot reload
      - .:/app
      - /app/node_modules  # Don't override node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debugger
```

```bash
# Run development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Debugging

```dockerfile
# Development stage in Dockerfile
FROM node:20-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Enable debugging
CMD ["node", "--inspect=0.0.0.0:9229", "server.js"]
```

---

## Networking

### Container Communication

```bash
# Create network
docker network create mynetwork

# Run containers on network
docker run -d --name api --network mynetwork myapp
docker run -d --name db --network mynetwork postgres

# Containers can reach each other by name
# From api container: postgres://db:5432
```

### Port Mapping

```bash
# Map port (host:container)
docker run -p 3000:3000 myapp          # Localhost only
docker run -p 0.0.0.0:3000:3000 myapp  # All interfaces

# Map multiple ports
docker run -p 3000:3000 -p 9229:9229 myapp

# Random host port
docker run -p 3000 myapp
docker port myapp 3000  # Shows assigned port
```

---

## Data Persistence

### Volumes

```bash
# Create named volume
docker volume create mydata

# Use volume
docker run -v mydata:/app/data myapp

# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Remove volume
docker volume rm mydata

# Remove unused volumes
docker volume prune
```

### Bind Mounts

```bash
# Mount host directory
docker run -v $(pwd)/data:/app/data myapp

# Read-only mount
docker run -v $(pwd)/config:/app/config:ro myapp
```

---

## Production Considerations

### Security

```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

# Don't store secrets in image
# Use environment variables or secrets management

# Scan images for vulnerabilities
# docker scan myapp:latest
```

### Image Size Optimization

```dockerfile
# Use Alpine base images
FROM node:20-alpine    # ~170MB vs ~1GB for full image

# Multi-stage builds
FROM node:20 AS builder
# ... build steps
FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist

# Clean up in same layer
RUN npm ci && npm cache clean --force

# Use .dockerignore
# node_modules
# .git
# tests
# *.md
```

### Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Resource Limits

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

```bash
# Or via docker run
docker run --memory=512m --cpus=0.5 myapp
```

---

## Common Patterns

### Twelve-Factor App

```dockerfile
# 1. Codebase: One codebase, many deploys (use tags)
# 2. Dependencies: Explicitly declare (package.json, requirements.txt)
# 3. Config: Store in environment variables
ENV NODE_ENV=production

# 4. Backing services: Treat as attached resources
# Connect via environment variables

# 5. Build, release, run: Strictly separate stages
# Use multi-stage builds

# 6. Processes: Execute as stateless processes
# Don't store state in container

# 7. Port binding: Export services via port
EXPOSE 3000

# 8. Concurrency: Scale out via process model
# Use container orchestration

# 9. Disposability: Fast startup and graceful shutdown
# Handle SIGTERM

# 10. Dev/prod parity: Keep environments similar
# Same Docker image everywhere

# 11. Logs: Treat as event streams
# Write to stdout/stderr

# 12. Admin processes: Run as one-off containers
# docker-compose run api npm run migrate
```

### Graceful Shutdown

```javascript
// server.js
const server = app.listen(3000);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

```dockerfile
# Use exec form of CMD (receives signals properly)
CMD ["node", "server.js"]

# Not shell form (signals go to shell, not app)
# CMD node server.js
```

---

## Interview Questions

**Q: What is Docker and why use it?**

A: Docker is a platform for running applications in containers—isolated environments with their own filesystems, networking, and process space. Benefits: consistent environments (dev/prod parity), isolation (dependencies don't conflict), portability (runs anywhere Docker runs), efficiency (faster than VMs, shares host kernel), and scalability (easily replicate containers).

**Q: What's the difference between an image and a container?**

A: An image is a read-only template containing the application, dependencies, and configuration. A container is a running instance of an image. You can run multiple containers from one image. Images are built from Dockerfiles; containers are created from images. Images are stored; containers are executed.

**Q: Explain Docker layers and caching.**

A: Each Dockerfile instruction creates a layer. Layers are cached and reused. When building, Docker checks if a layer changed—if not, it uses the cache. Order instructions from least to most frequently changed for better caching. The `COPY package*.json` before `RUN npm install` pattern leverages this: dependencies only reinstall when package.json changes.

**Q: What is Docker Compose?**

A: Docker Compose is a tool for defining multi-container applications in a YAML file. It simplifies running related services together (app + database + cache). One command (`docker-compose up`) starts everything with proper networking, volumes, and environment variables. Great for development and simple deployments.

**Q: How do containers communicate?**

A: Containers on the same Docker network can communicate using container names as hostnames. Docker Compose creates a network automatically. Containers can also communicate via exposed ports on the host, or through shared volumes. For production, use Docker networks rather than exposing all ports.

**Q: How do you persist data in Docker?**

A: Two main approaches: volumes and bind mounts. Volumes are managed by Docker, stored in Docker's directory, and preferred for production data. Bind mounts link to host filesystem paths, useful for development (code changes). Volumes persist beyond container lifecycle and can be shared between containers.

**Q: What's a multi-stage build?**

A: Multi-stage builds use multiple FROM statements to separate build and runtime environments. Build stage includes all build tools and dependencies. Production stage copies only necessary artifacts. Results in smaller, more secure images. Example: compile TypeScript in build stage, copy only JS to production stage.

---

## Practice Project

Containerize a full-stack application:

**Requirements:**
1. Node.js/Python API
2. React frontend
3. PostgreSQL database
4. Redis cache
5. Nginx reverse proxy
6. Multi-stage builds for optimization
7. Development and production configurations
8. Health checks
9. Volume persistence for database
10. Environment-based configuration

---

## Resources

- https://docs.docker.com/ (Official documentation)
- https://docs.docker.com/compose/ (Compose documentation)
- https://www.docker.com/blog/ (Best practices and updates)
- https://github.com/docker/awesome-compose (Example compose files)
