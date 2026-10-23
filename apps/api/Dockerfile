FROM node:24.21.0-bookworm-slim AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --omit=dev --workspace=@pyapy/api --workspace=@pyapy/contracts && npm cache clean --force
COPY --chown=node:node apps/api/src apps/api/src
COPY --chown=node:node packages/contracts packages/contracts
COPY --chown=node:node database database
COPY --chown=node:node scripts/migrate-container.mjs scripts/migrate-container.mjs
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node
EXPOSE 4100
CMD ["node", "apps/api/src/server.mjs"]

FROM node:24.21.0-bookworm-slim AS test
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000 --maxsockets=1 && npm cache clean --force
COPY --chown=node:node apps/api/src apps/api/src
COPY --chown=node:node packages/contracts packages/contracts
COPY --chown=node:node database database
COPY --chown=node:node scripts scripts
COPY --chown=node:node tests tests
RUN mkdir -p /tmp/test-uploads && chown node:node /tmp/test-uploads
USER node
CMD ["npm", "test"]

FROM runtime AS production
