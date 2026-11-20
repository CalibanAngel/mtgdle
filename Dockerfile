# syntax=docker/dockerfile:1
FROM oven/bun:1.3.3 AS bun
FROM node:24-bookworm-slim AS dependencies
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/api/package.json packages/api/package.json
COPY packages/front/package.json packages/front/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN bun run build:shared-types && bun run build:api
ENV VITE_API_URL=/api BACK_API_HOST=localhost BACK_API_PORT=3000
RUN bun run build:front

FROM build AS test
RUN bun run test:unit && bun run test:integration

FROM dependencies AS production-dependencies
RUN rm -rf node_modules packages/*/node_modules && bun install --production --frozen-lockfile

FROM node:24-bookworm-slim AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/ ./
COPY --from=build --chown=node:node /app/packages/api/dist ./packages/api/dist
COPY --from=build --chown=node:node /app/packages/shared-types/dist ./packages/shared-types/dist
USER node
WORKDIR /app/packages/api
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM nginxinc/nginx-unprivileged:1.28-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/game-proxy.conf /etc/nginx/game-proxy.conf
COPY --from=build /app/packages/front/dist /usr/share/nginx/html
EXPOSE 8080
