FROM node:20-bookworm-slim

# Dépendances système pour compiler better-sqlite3
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p data

EXPOSE 8080

CMD ["node", "src/server/server.js"]
