# Stage 1: Build the frontend static files
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend and run the service
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy backend files for dependency installation
COPY backend/pyproject.toml backend/uv.lock ./backend/
WORKDIR /app/backend
RUN uv sync --frozen --no-dev

# Copy the rest of the backend files
COPY backend/ /app/backend/

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/out /app/frontend/out

# Expose port 8000
EXPOSE 8000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000

# Run uvicorn server
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
