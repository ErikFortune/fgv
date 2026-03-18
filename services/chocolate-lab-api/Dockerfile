# =============================================================================
# Dockerfile for Chocolate Lab
# Expects pre-built artifacts: run `rush build` and `rush deploy` before
# building this image. The start-lab:stack Rush command does this automatically.
# =============================================================================

FROM node:22-bookworm-slim

# Create non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /app

# Copy the Rush deploy output (API service + node_modules)
COPY deploy/ /app/

# Copy frontend build output
COPY apps/chocolate-lab-web/dist /app/static

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

# Environment defaults
ENV PORT=3002
ENV STATIC_FILES_PATH=./static
ENV CHOCOLATE_LAB_STORAGE_TYPE=mongo
ENV MONGODB_DEFAULT_USER_ID=default-user

EXPOSE 3002

CMD ["node", "services/chocolate-lab-api/lib/index.js"]
