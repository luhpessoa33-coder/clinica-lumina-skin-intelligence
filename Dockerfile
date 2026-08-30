FROM node:22-slim
WORKDIR /app
RUN npm install -g corepack@latest
COPY package.json pnpm-lock.yaml ./
RUN corepack pnpm install --frozen-lockfile
COPY . .
RUN corepack pnpm build
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
