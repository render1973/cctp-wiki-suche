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

# Keine globale Git-Identität und kein globales `safe.directory` hier: jeder
# Git-Aufruf aus server/git.ts läuft mit einer eigenen, temporären
# GIT_CONFIG_GLOBAL-Datei (Committer-Identität per GIT_COMMITTER_NAME/_EMAIL,
# Autor per `--author`, vertraute Pfade per safe.directory) - eine hier
# gesetzte globale Config würde dafür ohnehin verdeckt, siehe Kommentar in
# server/git.ts. Das deckt auch ab, dass ein Bind-Mount (z. B.
# scripts/verify-docker-e2e.sh unter Docker Desktop/WSL2) aus Containersicht
# einem anderen Nutzer gehört ("dubious ownership").

ENV NODE_ENV=production

# Nur Dokumentation für Menschen/Tools - Railway setzt zur Laufzeit seine
# eigene PORT-Umgebungsvariable, die server/http.ts liest (process.env.PORT).
EXPOSE 8080

CMD ["npx", "tsx", "server/http.ts"]
