FROM node:22.13.0-slim AS build
WORKDIR /app
RUN npm install --global pnpm@10.4.1
COPY package.json ./
# O lockfile deve ser gerado e revisado antes do primeiro deploy produtivo.
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm run build && pnpm prune --prod

FROM node:22.13.0-slim AS runtime
WORKDIR /app
RUN groupadd --system lumina && useradd --system --gid lumina --create-home lumina
ENV NODE_ENV=production
COPY --from=build --chown=lumina:lumina /app/dist ./dist
COPY --from=build --chown=lumina:lumina /app/node_modules ./node_modules
USER lumina
CMD ["node", "dist/index.js"]
