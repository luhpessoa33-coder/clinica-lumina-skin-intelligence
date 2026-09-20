FROM node:22.13.0-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json ./
# O lockfile deve ser gerado e revisado antes do primeiro deploy produtivo.
RUN corepack pnpm install --no-frozen-lockfile
COPY . .
RUN corepack pnpm run build && corepack pnpm prune --prod

FROM node:22.13.0-slim AS runtime
WORKDIR /app
RUN groupadd --system lumina && useradd --system --gid lumina --create-home lumina
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build --chown=lumina:lumina /app/dist ./dist
COPY --from=build --chown=lumina:lumina /app/node_modules ./node_modules
USER lumina
EXPOSE 3000
CMD ["node", "dist/index.js"]
