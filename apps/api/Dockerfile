FROM node:24.21.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --omit=dev --workspace=@pyapy/api --workspace=@pyapy/contracts && npm cache clean --force
COPY --chown=node:node apps/api/src apps/api/src
COPY --chown=node:node packages/contracts packages/contracts
COPY --chown=node:node database database
COPY --chown=node:node scripts/migrate-container.mjs scripts/migrate-container.mjs
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node
EXPOSE 4100
CMD ["node", "apps/api/src/server.mjs"]
