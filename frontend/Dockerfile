# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# VITE_API_URL is baked into the static bundle at build time (Vite env vars
# are compile-time, not runtime) — pass it with --build-arg if the API isn't
# served from the same origin as the frontend.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build


FROM nginx:1.27-alpine AS runtime

RUN adduser -D -H -u 10001 appuser \
    && rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

# nginx needs to write its pid file and temp dirs; hand the whole runtime
# state directory to the non-root user rather than punching individual holes.
RUN mkdir -p /var/cache/nginx /var/run \
    && chown -R appuser:appuser /var/cache/nginx /var/run /usr/share/nginx/html /etc/nginx/conf.d

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
