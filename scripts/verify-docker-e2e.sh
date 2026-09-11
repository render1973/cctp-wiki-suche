#!/usr/bin/env bash
# Baut das Docker-Image, startet einen Container und wiederholt die
# End-to-End-Verifikation (Token A schreibt, Token B liest, Autor-Check,
# fehlendes/ungültiges Token abgewiesen) gegen den laufenden CONTAINER statt
# gegen einen nackten Node-Prozess.
#
# Sicherheitsmechanismus: Der Container pusht NICHT gegen das echte GitHub.
# Der Git-Remote "origin" wird im Container zur Laufzeit auf ein frisches
# lokales bare Repo umgebogen (git remote set-url) - das im Image enthaltene
# .git zeigt sonst auf das echte Repo, siehe Dockerfile.
#
# Voraussetzungen: docker, Node/npx (für den MCP-Testclient), git.
# Aufruf: ./scripts/verify-docker-e2e.sh
#
# Docker-Desktop/WSL2-Fallstrick: mktemp -d legt unter /tmp an, das bei
# Docker Desktop mit WSL2-Backend nicht immer bind-mountbar ist ("/tmp"-Pfad
# nicht auflösbar). Statt eines System-Temp-Pfads liegt das Arbeitsverzeichnis
# darum standardmässig direkt im Projekt (.e2e-tmp/), das für Docker ohnehin
# schon erreichbar sein muss (der Build liest ja dasselbe Verzeichnis). Bei
# Bedarf überschreibbar: E2E_WORKDIR=/mnt/c/pfad/den/docker/mounten/kann
# ./scripts/verify-docker-e2e.sh (unter WSL: /mnt/c/... statt C:\...).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="cctp-wiki-suche:e2e"
CONTAINER_NAME="cctp-wiki-suche-e2e-$$"
PORT="${PORT:-8091}"
WORKDIR="${E2E_WORKDIR:-$REPO_ROOT/.e2e-tmp/run-$$}"
BARE_REPO="$WORKDIR/test-origin.git"
CURRENT_BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"

mkdir -p "$WORKDIR"
echo "Arbeitsverzeichnis für den Test: $WORKDIR"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "=== 1/6: Docker-Image bauen ==="
docker build -t "$IMAGE_TAG" "$REPO_ROOT"

echo "=== 2/6: Leeres lokales Test-Repo als Push-Ziel anlegen (NICHT das echte GitHub) ==="
git init --bare --initial-branch="$CURRENT_BRANCH" "$BARE_REPO" >/dev/null

echo "=== 3/6: Container starten (origin im Container auf das Test-Repo umgebogen) ==="
# Der Container pusht beim Start einmal seinen eigenen (im Image gebackenen)
# HEAD in das leere Test-Repo, damit die Historie zueinander passt -
# git pull --rebase in server/git.ts ist danach ein reines Fast-Forward,
# ohne die Arbeitskopie zu verändern.
#
# `git config --global --add safe.directory /test-origin.git` hier ist bewusst
# eine dauerhafte globale Config-Änderung - aber NUR innerhalb dieses einen
# Wegwerf-Containers (--rm, stirbt mit dem Testlauf), nicht auf dem Host und
# nicht im echten Produktivbetrieb. Server/git.ts selbst nutzt für seine
# eigenen Git-Aufrufe einen anderen, zustandslosen Mechanismus (siehe dort);
# dieser eine Bootstrap-Push läuft aber vor dem Node-Prozess in einer reinen
# Shell und braucht darum seinen eigenen, hier lokal begrenzten Fix, um an
# das per Bind-Mount eingehängte (aus Containersicht fremd besitzende)
# Test-Repo pushen zu können.
docker run -d --rm \
  --name "$CONTAINER_NAME" \
  -p "$PORT:8080" \
  -v "$BARE_REPO:/test-origin.git" \
  -e WIKI_TOKENS='{"tok-a-geheim":{"name":"Person A (Verifikation)","email":"person-a@example.invalid"},"tok-b-geheim":{"name":"Person B (Verifikation)","email":"person-b@example.invalid"}}' \
  --entrypoint sh \
  "$IMAGE_TAG" \
  -c "git config --global --add safe.directory /test-origin.git && git remote set-url origin /test-origin.git && git push origin HEAD:$CURRENT_BRANCH && exec npx tsx server/http.ts" \
  >/dev/null

echo "=== 4/6: Warten, bis der Server im Container bereit ist ==="
for i in $(seq 1 30); do
  if curl -sS "http://localhost:$PORT/" >/dev/null 2>&1; then
    echo "Server bereit nach ${i}s."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "FEHLER: Server im Container nicht bereit geworden. Container-Logs:"
    docker logs "$CONTAINER_NAME" || true
    exit 1
  fi
  sleep 1
done

echo "=== 5/6: Echten MCP-Client gegen den Container laufen lassen ==="
set +e
MCP_URL="http://localhost:$PORT/mcp" TOKEN_A="tok-a-geheim" TOKEN_B="tok-b-geheim" \
  npx tsx "$REPO_ROOT/scripts/e2e-client.mts"
CLIENT_EXIT=$?
set -e

echo "=== 6/6: Autor/Committer im Test-Repo (nicht im echten GitHub) prüfen ==="
git --git-dir="$BARE_REPO" log -3 --oneline "$CURRENT_BRANCH" || true
echo "--- Autor des letzten Commits ---"
git --git-dir="$BARE_REPO" log -1 --format='Author: %an <%ae>%nCommitter: %cn <%ce>' "$CURRENT_BRANCH"

echo ""
echo "=== Container-Logs (letzte 20 Zeilen) ==="
docker logs --tail 20 "$CONTAINER_NAME" || true

if [ "$CLIENT_EXIT" -ne 0 ]; then
  echo "FEHLGESCHLAGEN: siehe Schritt 5."
  exit 1
fi
echo ""
echo "ERFOLG: Docker-Image gebaut, Container gestartet, End-to-End-Verifikation gegen den Container bestanden."
