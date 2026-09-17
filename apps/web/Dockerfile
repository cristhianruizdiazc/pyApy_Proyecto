FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace=@pyapy/web --workspace=@pyapy/contracts
COPY packages/contracts packages/contracts
COPY apps/web apps/web
RUN npm run build --workspace=@pyapy/web
FROM nginxinc/nginx-unprivileged:1.30-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
