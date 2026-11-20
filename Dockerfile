# --- dependências: instaladas com o bun a partir do bun.lock ---
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- build: o next build roda no Node ---
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# variáveis NEXT_PUBLIC_* são gravadas no JavaScript durante o build. Como ARG, mudar o valor
# invalida o cache desta etapa e força um next build novo (com env comum o cache era reaproveitado)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# --- runtime ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# o healthcheck do Coolify roda curl ou wget dentro do container, e a imagem slim não traz nenhum
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
# o usuário node precisa escrever em .next/cache (cache das imagens otimizadas pelo next/image)
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./

USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
