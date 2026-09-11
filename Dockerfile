# Für den gehosteten HTTP-Modus (Railway). Der lokale stdio-Modus (npm start)
# braucht dieses Image nicht - der läuft direkt auf Thomas' Rechner.
#
# git muss zur LAUFZEIT im Container vorhanden sein, nicht nur beim Build:
# schreibe_wiki_seite committet und pusht über server/git.ts. Das schlanke
# node-Image bringt kein git mit, daher explizit installieren.
FROM node:20-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# .git wird bewusst mitkopiert (siehe .dockerignore) - der Server committet in
# genau dieser Arbeitskopie und pusht von hier aus nach origin.
COPY . .

# Committer-Identität für den Bot-Committer (der eigentliche Autor pro Seite
# kommt aus dem Token-Mapping und wird per `git commit --author` gesetzt, siehe
# server/git.ts). Ohne diese Konfiguration lehnt git jeden Commit ab.
RUN git config --global user.name "CCTP Wiki Bot" \
 && git config --global user.email "wiki-bot@cctp-wiki-suche.noreply" \
 && git config --global --add safe.directory /app

ENV NODE_ENV=production

# Nur Dokumentation für Menschen/Tools - Railway setzt zur Laufzeit seine
# eigene PORT-Umgebungsvariable, die server/http.ts liest (process.env.PORT).
EXPOSE 8080

CMD ["npx", "tsx", "server/http.ts"]
