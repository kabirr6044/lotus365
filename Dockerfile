FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Render supplies service environment variables as Docker build arguments.
# NEXT_PUBLIC_* values must be available when Next.js builds the browser bundle.
ARG NEXT_PUBLIC_DESTINATION_URL=""
ARG SITE_URL=""
ARG RENDER_EXTERNAL_URL=""
ENV NEXT_PUBLIC_DESTINATION_URL=${NEXT_PUBLIC_DESTINATION_URL} \
    SITE_URL=${SITE_URL} \
    RENDER_EXTERNAL_URL=${RENDER_EXTERNAL_URL}
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=10000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 10000
CMD ["node", "server.js"]
